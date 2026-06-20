const mongoose = require('mongoose');

const CategoryConfigSchema = new mongoose.Schema({
    enabled: { type: Boolean, default: true },
    confidenceThreshold: { type: Number, default: 80, min: 0, max: 100 },
    enforcementBehavior: { type: String, enum: ['Auto-Block', 'Flag for Review'], default: 'Flag for Review' }
}, { _id: false });

const PolicySchema = new mongoose.Schema({
    active: { type: Boolean, default: false },
    categories: {
        graphicViolence: { type: CategoryConfigSchema, default: () => ({}) },
        hateSymbols: { type: CategoryConfigSchema, default: () => ({}) },
        selfHarm: { type: CategoryConfigSchema, default: () => ({}) },
        extremistPropaganda: { type: CategoryConfigSchema, default: () => ({}) },
        weaponsContraband: { type: CategoryConfigSchema, default: () => ({}) },
        harassmentHumiliation: { type: CategoryConfigSchema, default: () => ({}) },
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Policy', PolicySchema);
