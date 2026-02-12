import { useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";

interface CategoryTileSectionProps {
  title?: string;
  tiles: Array<{
    id: string;
    name: string;
    productImages?: string[];
    image?: string;
    categoryId?: string;
    subcategoryId?: string;
    sellerId?: string;
    productCount?: number;
  }>;
  columns?: number;
  showProductCount?: boolean;
}

const CategoryTileSection = ({
  title,
  tiles,
  columns = 4,
  showProductCount = false
}: CategoryTileSectionProps) => {
  const navigate = useNavigate();

  const getGridCols = () => {
    switch (columns) {
      case 2: return "grid-cols-2";
      case 3: return "grid-cols-3";
      case 4: return "grid-cols-4";
      case 6: return "grid-cols-3 md:grid-cols-6";
      case 8: return "grid-cols-4 md:grid-cols-8";
      default: return "grid-cols-4 md:grid-cols-4 lg:grid-cols-6";
    }
  };

  if (!tiles || tiles.length === 0) return null;

  return (
    <div className="mb-8 md:mb-12">
      {title && (
        <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 mb-4 md:mb-6">
          <h2 className="text-lg md:text-2xl font-bold text-neutral-900 tracking-tight capitalize">
            {title}
          </h2>
          {tiles.length > 4 && (
            <button className="text-[hsl(var(--user-accent))] text-xs md:text-sm font-bold hover:underline">
              View All
            </button>
          )}
        </div>
      )}

      <div className="px-4 md:px-6 lg:px-8">
        <div className={cn("grid gap-3 md:gap-4 lg:gap-6", getGridCols())}>
          {tiles.map((tile) => {
            const targetUrl = tile.categoryId ? `/category/${tile.categoryId}` :
              tile.subcategoryId ? `/category/${tile.subcategoryId}` :
                tile.sellerId ? `/store/${tile.sellerId}` :
                  tile.id ? `/category/${tile.id}` : '#';

            const images = tile.productImages || (tile.image ? [tile.image] : []);

            return (
              <div
                key={tile.id || tile.name}
                className="group flex flex-col items-center cursor-pointer"
                onClick={() => navigate(targetUrl)}
              >
                <div
                  className={cn(
                    "relative block w-full rounded-xl md:rounded-2xl overflow-hidden transition-all duration-300",
                    showProductCount ? "aspect-[4/5] p-2 bg-white shadow-sm border border-neutral-100 group-hover:shadow-md" : "aspect-square p-2 bg-white shadow-sm border border-neutral-100 group-hover:shadow-md"
                  )}
                >
                  <div className="w-full h-full relative">
                    {images && images.length >= 4 ? (
                      <div className="grid grid-cols-2 gap-1 h-full w-full">
                        {images.slice(0, 4).map((img, idx) => (
                          <div key={idx} className="bg-neutral-50 rounded-md overflow-hidden flex items-center justify-center p-1">
                            <img src={img} alt="" className="w-full h-full object-contain" />
                          </div>
                        ))}
                      </div>
                    ) : images && images.length > 0 ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <img
                          src={images[0]}
                          alt={tile.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-100/50 rounded-lg">
                        <span className="text-2xl font-bold text-neutral-300 uppercase">
                          {tile.name?.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {showProductCount && (
                    <div className="absolute inset-x-2 bottom-2 bg-black/5 backdrop-blur-sm rounded-lg py-1 flex items-center justify-center text-[9px] font-bold text-neutral-600 uppercase tracking-tight">
                      {tile.productCount || 0}+ Items
                    </div>
                  )}
                </div>

                <span className="mt-2 text-[10px] md:text-xs font-semibold text-neutral-800 text-center line-clamp-2 px-1">
                  {tile.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryTileSection;
