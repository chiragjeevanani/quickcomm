
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Seller from '../models/Seller';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dhakadsnazzy';

async function checkSellers() {
    try {
        await mongoose.connect(MONGO_URI);
        const sellers = await Seller.find({}, 'sellerName mobile email status');
        console.log('All Sellers:');
        console.log(JSON.stringify(sellers, null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkSellers();
