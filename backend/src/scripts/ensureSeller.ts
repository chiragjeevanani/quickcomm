
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Seller from '../models/Seller';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dhakadsnazzy';

async function ensureSeller() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const mobile = '9876543210';
        let seller = await Seller.findOne({ mobile });

        if (seller) {
            console.log('Seller already exists:', seller.sellerName);
        } else {
            console.log('Seller not found. Creating default seller...');
            seller = await Seller.create({
                sellerName: 'Dhakad Snazzy Retail',
                email: 'retail@dhakadsnazzy.com',
                password: 'password123', // Will be hashed by pre-save hook
                mobile: mobile,
                storeName: 'Dhakad Snazzy Retail Pvt Ltd',
                category: 'Grocery',
                commission: 0,
                status: 'Approved',
                isVerified: true,
                isShopOpen: true,
                location: {
                    type: 'Point',
                    coordinates: [75.8577, 22.7196]
                },
                address: '123 Test Street, Indore',
                city: 'Indore',
                serviceRadiusKm: 10
            });
            console.log('Seller created successfully:', seller.sellerName);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error ensuring seller:', error);
        process.exit(1);
    }
}

ensureSeller();
