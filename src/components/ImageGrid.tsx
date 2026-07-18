import type { GalleryItem } from '../data/gallery'

interface ImageGridProps {
  items: GalleryItem[]
  onOpen: (localIndex: number) => void
}

function ImageGrid({ items, onOpen }: ImageGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item, i) => (
        <button
          key={item.src}
          type="button"
          onClick={() => onOpen(i)}
          className="group block overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-left focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
        >
          <img
            src={item.src}
            alt={item.alt}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {item.caption && (
            <span className="block px-3 py-2 text-xs text-slate-500 break-keep">{item.caption}</span>
          )}
        </button>
      ))}
    </div>
  )
}

export default ImageGrid
