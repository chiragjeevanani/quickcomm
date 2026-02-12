
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Seller from '../models/Seller';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dhakadsnazzy';

async function createBypassSeller() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const mobile = '9111966732';
        const existing = await Seller.findOne({ mobile });

        if (existing) {
            console.log(`Seller with mobile ${mobile} already exists (${existing.sellerName})`);
            process.exit(0);
        }

        await Seller.create({
            sellerName: 'Bypass Test Seller',
            mobile: mobile,
            email: 'bypass@Dhakad Snazzy.com',
            storeName: 'Bypass Test Store',
            category: 'Electronics',
            address: 'Test Address',
            city: 'Test City',
            status: 'Approved',
            isVerified: true
        });

        console.log(`✓ Bypass seller created successfully.`);
        console.log(`  Mobile: ${mobile}`);
        console.log(`  OTP (Bypass): 1234`);

        process.exit(0);
    } catch (error) {
        console.error('Error creating bypass seller:', error);
        process.exit(1);
    }
}

createBypassSeller();
