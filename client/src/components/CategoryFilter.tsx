import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface CategoryFilterProps {
  categories: string[];
  selected?: string;
  onSelect: (category: string) => void;
}

const categoryEmojis: Record<string, string> = {
  "돌봄": "👶",
  "의료": "🏥",
  "환경": "🌱",
  "교육": "📚",
  "생활": "🏠",
  "교통": "🚗",
  "경제": "💰",
  "문화": "🎨",
  "정치": "🏛️",
  "행정": "📋",
  "복지": "🤝",
};

export default function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <ScrollArea className="w-full" data-testid="filter-categories">
      <div className="flex gap-2 p-4">
        <Button
          variant={!selected ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect("")}
          data-testid="button-category-all"
        >
          🏘️ 전체
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant={selected === category ? "default" : "outline"}
            size="sm"
            onClick={() => onSelect(category)}
            data-testid={`button-category-${category}`}
          >
            {categoryEmojis[category]} {category}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
