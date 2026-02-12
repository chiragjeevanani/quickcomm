import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Clock, ShieldCheck, Info } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { appConfig } from '../../services/configService';
import { calculateProductPrice } from '../../utils/priceUtils';
import { cn } from '@/lib/utils';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  const deliveryFee = cart.total >= appConfig.freeDeliveryThreshold ? 0 : appConfig.deliveryFee;
  const platformFee = appConfig.platformFee;
  const totalAmount = cart.total + deliveryFee + platformFee;

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (cart.items.length === 0) {
    return (
      <div className="px-4 py-16 md:py-24 text-center max-w-md mx-auto">
        <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart size={40} className="text-neutral-400" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Your basket is empty</h2>
        <p className="text-neutral-600 mb-8">Looks like you haven't added anything to your basket yet. Let's find some great products for you!</p>
        <Link to="/">
          <Button variant="user" size="lg" className="w-full">
            Start Shopping
            <ArrowRight size={18} className="ml-2" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-4 md:pb-8">
      {/* Header */}
      <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6 bg-white border-b border-neutral-100 mb-4 md:mb-6 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-neutral-900 uppercase tracking-tight">Your Basket</h1>
            <Badge variant="user" className="rounded-full">
              {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}
            </Badge>
          </div>
          {cart.items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 size={16} className="mr-1.5" />
              Clear All
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-[hsl(var(--user-accent))] uppercase tracking-wider">
          <Clock size={14} className="animate-pulse" />
          Delivered in {appConfig.estimatedDeliveryTime}
        </div>
      </div>

      {/* Cart Items */}
      <div className="px-4 md:px-6 lg:px-8 space-y-4 md:space-y-6 mb-4 md:mb-6">
        {cart.items.map((item) => {
          const { displayPrice, mrp, hasDiscount } = calculateProductPrice(item.product, item.variant);
          return (
            <Card
              key={item.product.id}
              className="overflow-hidden border-neutral-100 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="p-4 md:p-6">
                <div className="flex gap-4 md:gap-6">
                  {/* Product Image */}
                  <div className="w-20 h-20 md:w-28 md:h-28 bg-neutral-50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-neutral-100 group-hover:scale-105 transition-transform">
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-100 rounded-2xl">
                        <span className="text-2xl font-bold text-neutral-300">
                          {item.product.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-neutral-900 mb-1 md:mb-2 line-clamp-2 md:text-lg group-hover:text-[hsl(var(--user-accent))] transition-colors">
                      {item.product.name}
                    </h3>
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">{item.product.pack}</p>
                    <div className="flex items-center gap-2 mb-3 md:mb-4">
                      <span className="text-lg md:text-xl font-black text-neutral-900">
                        ₹{displayPrice.toLocaleString('en-IN')}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs md:text-sm text-neutral-400 line-through font-medium">
                          ₹{mrp.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1 bg-neutral-50 rounded-2xl p-1 w-fit border border-neutral-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variant)}
                        className="w-8 h-8 md:w-9 md:h-9 rounded-xl hover:bg-white hover:text-red-600 transition-all shadow-sm"
                      >
                        <Minus size={14} />
                      </Button>
                      <span className="text-base md:text-lg font-black text-neutral-900 min-w-[2.5rem] text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant)}
                        className="w-8 h-8 md:w-9 md:h-9 rounded-xl hover:bg-white hover:text-[hsl(var(--user-accent))] transition-all shadow-sm"
                      >
                        <Plus size={14} />
                      </Button>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-lg font-black text-neutral-900">
                        ₹{(displayPrice * item.quantity).toFixed(0)}
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-neutral-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all self-start"
                    aria-label="Remove item"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Order Summary */}
      <div className="px-4 md:px-6 lg:px-8 mb-24 md:mb-8 grid md:grid-cols-2 gap-8 items-start">
        {/* Safety & Trust (Desktop) */}
        <div className="hidden md:block space-y-4">
          <div className="p-4 bg-green-50 rounded-2xl flex gap-3 border border-green-100">
            <ShieldCheck className="text-green-600 flex-shrink-0" size={24} />
            <div>
              <h4 className="font-bold text-green-900 text-sm">Safe & Secure Payments</h4>
              <p className="text-xs text-green-700">Your payments are protected with industry-standard encryption.</p>
            </div>
          </div>
          <div className="p-4 bg-blue-50 rounded-2xl flex gap-3 border border-blue-100">
            <Info className="text-blue-600 flex-shrink-0" size={24} />
            <div>
              <h4 className="font-bold text-blue-900 text-sm">Quick Support</h4>
              <p className="text-xs text-blue-700">Need help? Our customer support is available 24/7.</p>
            </div>
          </div>
        </div>

        <Card className="p-4 md:p-6 shadow-xl border-neutral-100 rounded-3xl md:max-w-md md:ml-auto">
          <h2 className="text-lg md:text-xl font-black text-neutral-900 mb-4 md:mb-6 uppercase tracking-tight">Order Summary</h2>
          <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
            <div className="flex justify-between text-neutral-600 font-medium md:text-base">
              <span>Subtotal</span>
              <span className="text-neutral-900">₹{cart.total.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-neutral-600 font-medium md:text-base">
              <span>Platform Fee</span>
              <span className="text-neutral-900">₹{platformFee.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-neutral-600 font-medium md:text-base">
              <span>Delivery Charges</span>
              <span className={cn("font-bold tracking-tight", deliveryFee === 0 ? 'text-green-600' : 'text-neutral-900')}>
                {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toLocaleString('en-IN')}`}
              </span>
            </div>
            {cart.total < appConfig.freeDeliveryThreshold && (
              <div className="text-[10px] uppercase tracking-wider font-black text-green-600 bg-green-50 px-3 py-1.5 rounded-full inline-block">
                Add ₹{(appConfig.freeDeliveryThreshold - cart.total).toLocaleString('en-IN')} more for free delivery
              </div>
            )}
          </div>
          <div className="border-t border-neutral-100 pt-4 md:pt-6">
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-black text-neutral-900 uppercase tracking-tight">Total</span>
              <span className="text-2xl font-black text-[hsl(var(--user-accent))]">
                ₹{totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <Button
              variant="user"
              size="lg"
              onClick={handleCheckout}
              className="w-full rounded-2xl h-14 text-lg font-bold"
            >
              Proceed to Checkout
              <ArrowRight size={20} className="ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

