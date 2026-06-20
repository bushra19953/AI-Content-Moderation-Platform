const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const Verdict = require('../models/Verdict');
const Policy = require('../models/Policy');
const { protect } = require('../middleware/auth');
const { withRotation } = require('../services/geminiKeyRotation');

const evaluateImageWithGemini = async (base64Image, mimeType, policy) => {
    return await withRotation(async (client) => {
        const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

    const categories = ['graphicViolence', 'hateSymbols', 'selfHarm', 'extremistPropaganda', 'weaponsContraband', 'harassmentHumiliation'];
    
        const prompt = `Analyze this image for content moderation based on the following policy categories:
        1. Graphic Violence: ANY depictions of blood, gore, injuries, or violent acts, including fake blood, movie props, or simulated violence. If you see blood or gore, the score MUST be 90-100.
        2. Hate Symbols: Swastikas, racist symbols, or extremist iconography.
        3. Self-Harm: Depictions or encouragement of self-injury or suicide.
        4. Extremist Propaganda: Material promoting terrorist or extremist groups.
        5. Weapons & Contraband: ANY firearms (guns, rifles, pistols), knives, explosive devices, drugs, or restricted items. If you see a gun clearly, the score for this MUST be 90-100.
        6. Harassment & Humiliation: Bullying, doxxing, or degrading content.

        For each category, determine a confidence score from 0 to 100 on how likely the image contains that type of content.
        Respond ONLY with a JSON object in the exact format:
    {
      "graphicViolence": { "detected": boolean, "confidence": number, "reasoning": "string" },
      "hateSymbols": { "detected": boolean, "confidence": number, "reasoning": "string" },
      "selfHarm": { "detected": boolean, "confidence": number, "reasoning": "string" },
      "extremistPropaganda": { "detected": boolean, "confidence": number, "reasoning": "string" },
      "weaponsContraband": { "detected": boolean, "confidence": number, "reasoning": "string" },
      "harassmentHumiliation": { "detected": boolean, "confidence": number, "reasoning": "string" }
    }
    Make sure the response is purely valid JSON without any markdown formatting wrappers.
    `;

    const imageParts = [
        {
            inlineData: {
                data: base64Image,
                mimeType: mimeType
            }
        }
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();
    
    let parsedData;
    try {
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedData = JSON.parse(cleanJson);
    } catch (e) {
        console.error("Failed to parse Gemini response:", responseText);
        throw new Error("Invalid response format from AI model.");
    }

    const breakdown = [];
    let overallOutcome = 'Approved';

    for (const cat of categories) {
        const catConfig = policy.categories[cat];
        if (!catConfig.enabled) continue;

        const aiResult = parsedData[cat];
        const confidenceScore = aiResult.confidence || 0;
        
        const classification = confidenceScore >= catConfig.confidenceThreshold;
        
        breakdown.push({
            category: cat,
            classification,
            confidenceScore,
            reasoning: aiResult.reasoning || "No reasoning provided."
        });

        if (classification) {
            if (catConfig.enforcementBehavior === 'Auto-Block') {
                overallOutcome = 'Blocked';
            } else if (overallOutcome !== 'Blocked') {
                overallOutcome = 'Flagged for Review';
            }
        }
    }

    return { overallOutcome, breakdown };
    });
};

router.post('/', protect, async (req, res) => {
    try {
        const { imageUrl } = req.body; 
        let policy = await Policy.findOne({ active: true });
        
        if (!policy) {
            policy = await Policy.create({ active: true });
        }

        let base64Data = imageUrl;
        let mimeType = 'image/jpeg';
        
        if (imageUrl && imageUrl.startsWith('data:')) {
            const matches = imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                mimeType = matches[1];
                base64Data = matches[2];
            }
        } else if (!imageUrl) {
             return res.status(400).json({ message: "Image data is required" });
        }

        const submission = await Submission.create({
            userId: req.user._id,
            imageUrl: "Stored in Database" // In a production app, save base64 to an S3 bucket and store the public URL.
        });

        const evaluation = await evaluateImageWithGemini(base64Data, mimeType, policy);

        const verdict = await Verdict.create({
            submissionId: submission._id,
            overallOutcome: evaluation.overallOutcome,
            categoryBreakdown: evaluation.breakdown,
            policyId: policy._id
        });

        submission.verdictId = verdict._id;
        await submission.save();

        res.status(201).json({ submission, verdict });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/', protect, async (req, res) => {
    try {
        const submissions = await Submission.find({ userId: req.user._id }).populate('verdictId').sort({ createdAt: -1 });
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
