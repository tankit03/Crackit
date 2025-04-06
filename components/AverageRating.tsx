import { Star } from 'lucide-react';

interface Review {
  rating: number;
}

interface AverageRatingProps {
  reviews: Review[];
}

export function AverageRating({ reviews }: AverageRatingProps) {
  if (!reviews || reviews.length === 0) {
    return null;
  }

  const averageRating =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  const roundedRating = Math.round(averageRating * 10) / 10; // Round to 1 decimal place

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < Math.round(averageRating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">
        {roundedRating} ({reviews.length}{' '}
        {reviews.length === 1 ? 'review' : 'reviews'})
      </span>
    </div>
  );
}
