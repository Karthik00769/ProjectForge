import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
    uid: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    displayName: {
        type: String,
    },
    photoURL: {
        type: String,
    },
    role: {
        type: String,
        default: 'user', // 'user', 'admin'
    },
    credits: {
        type: Number,
        default: 0,
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false,
    },
    twoFactorMethod: {
        type: String, // 'totp' or 'pin'
        default: 'totp',
    },
    twoFactorSecret: {
        type: String, // Encrypted secret for TOTP
        required: false,
    },
    twoFactorPin: {
        type: String, // Encrypted 6-digit PIN
        required: false,
    },
    twoFactorEnabledAt: {
        type: Date,
        required: false,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

const User = models.User || model('User', UserSchema);

export default User;
