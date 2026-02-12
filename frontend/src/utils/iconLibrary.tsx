import React from 'react';
import {
    ShoppingBasket, Utensils, Leaf, HardHat as FruitIcon, Croissant as BakeryIcon,
    Coffee, Soup as MeatIcon, IceCream, Pizza, Shirt,
    Smartphone, Laptop, Headphones, Camera, Home,
    Armchair as FurnitureIcon, Sparkles, ChefHat, Heart,
    Stethoscope, Baby, Dog, Trophy, Dumbbell, Book,
    Gamepad2, Car, PartyPopper, Snowflake, Watch, Gem, ShoppingBag,
    User, Footprints as ShoeIcon
} from 'lucide-react';

export interface IconDef {
    name: string;
    label: string;
    tags: string[];
    svg: React.ReactNode;
}

export const ICON_LIBRARY: IconDef[] = [
    { name: 'grocery-basket', label: 'Grocery Basket', tags: ['grocery'], svg: <ShoppingBasket size={24} /> },
    { name: 'fast-food', label: 'Fast Food', tags: ['fast'], svg: <Utensils size={24} /> },
    { name: 'vegetables', label: 'Vegetables', tags: ['vegetable'], svg: <Leaf size={24} /> },
    { name: 'fruits', label: 'Fruits', tags: ['fruit'], svg: <FruitIcon size={24} /> },
    { name: 'bakery', label: 'Bakery', tags: ['bakery'], svg: <BakeryIcon size={24} /> },
    { name: 'coffee-tea', label: 'Tea & Coffee', tags: ['coffee'], svg: <Coffee size={24} /> },
    { name: 'meat-fish', label: 'Meat & Fish', tags: ['meat'], svg: <MeatIcon size={24} /> },
    { name: 'ice-cream', label: 'Ice Cream', tags: ['ice'], svg: <IceCream size={24} /> },
    { name: 'pizza', label: 'Pizza', tags: ['pizza'], svg: <Pizza size={24} /> },
    { name: 'fashion', label: 'Fashion', tags: ['fashion'], svg: <Shirt size={24} /> },
    { name: 'mens-wear', label: 'Mens Wear', tags: ['men'], svg: <Shirt size={24} /> },
    { name: 'womens-wear', label: 'Womens Wear', tags: ['women'], svg: <Shirt size={24} /> },
    { name: 'footwear', label: 'Footwear', tags: ['foot'], svg: <ShoeIcon size={24} /> },
    { name: 'watches', label: 'Watches', tags: ['watch'], svg: <Watch size={24} /> },
    { name: 'jewelry', label: 'Jewelry', tags: ['jewelry'], svg: <Gem size={24} /> },
    { name: 'bags', label: 'Bags', tags: ['bag'], svg: <ShoppingBag size={24} /> },
    { name: 'electronics', label: 'Electronics', tags: ['electronics'], svg: <Laptop size={24} /> },
    { name: 'mobiles', label: 'Mobiles', tags: ['mobile'], svg: <Smartphone size={24} /> },
    { name: 'laptops', label: 'Laptops', tags: ['laptop'], svg: <Laptop size={24} /> },
    { name: 'headphones', label: 'Headphones', tags: ['audio'], svg: <Headphones size={24} /> },
    { name: 'camera', label: 'Cameras', tags: ['photo'], svg: <Camera size={24} /> },
    { name: 'home', label: 'Home & Living', tags: ['home'], svg: <Home size={24} /> },
    { name: 'furniture', label: 'Furniture', tags: ['furniture'], svg: <FurnitureIcon size={24} /> },
    { name: 'clean', label: 'Cleaning', tags: ['clean'], svg: <Sparkles size={24} /> },
    { name: 'kitchen', label: 'Kitchen', tags: ['kitchen'], svg: <ChefHat size={24} /> },
    { name: 'beauty', label: 'Beauty', tags: ['beauty'], svg: <Sparkles size={24} /> },
    { name: 'medicine', label: 'Medicine', tags: ['medicine'], svg: <Stethoscope size={24} /> },
    { name: 'baby', label: 'Baby Care', tags: ['baby'], svg: <Baby size={24} /> },
    { name: 'pet', label: 'Pet Care', tags: ['pet'], svg: <Dog size={24} /> },
    { name: 'sports', label: 'Sports', tags: ['sports'], svg: <Trophy size={24} /> },
    { name: 'fitness', label: 'Fitness', tags: ['fitness'], svg: <Dumbbell size={24} /> },
    { name: 'books', label: 'Books', tags: ['books'], svg: <Book size={24} /> },
    { name: 'toys', label: 'Toys', tags: ['toys'], svg: <Gamepad2 size={24} /> },
    { name: 'automotive', label: 'Automotive', tags: ['auto'], svg: <Car size={24} /> },
    { name: 'wedding', label: 'Wedding', tags: ['wedding'], svg: <Heart size={24} /> },
    { name: 'party', label: 'Party Needs', tags: ['party'], svg: <PartyPopper size={24} /> },
    { name: 'winter', label: 'Winter', tags: ['winter'], svg: <Snowflake size={24} /> }
];

export const getIconByName = (name: string): React.ReactNode => {
    const found = ICON_LIBRARY.find(icon => icon.name === name);
    return found ? found.svg : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
    );
};
