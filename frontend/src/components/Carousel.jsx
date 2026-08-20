import { useEffect, useState } from 'react';

export default function Carousel({ items, altPrefix }) {
  const [index, setIndex] = useState(0);
  const count = items.length;

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  if (count === 0) return null;

  return (
    <div className="carousel">
      <div className="carousel__track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {items.map((src, i) => (
          <div className="carousel__slide" key={src}>
            <img src={src} alt={`${altPrefix} ${i + 1}`} />
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            className="carousel__btn carousel__btn--prev"
            type="button"
            aria-label="Предыдущее фото"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            ‹
          </button>
          <button
            className="carousel__btn carousel__btn--next"
            type="button"
            aria-label="Следующее фото"
            disabled={index === count - 1}
            onClick={() => setIndex((i) => Math.min(count - 1, i + 1))}
          >
            ›
          </button>
          <div className="carousel__dots" role="tablist">
            {items.map((src, i) => (
              <button
                key={src}
                type="button"
                className={i === index ? 'carousel__dot is-active' : 'carousel__dot'}
                aria-label={`Слайд ${i + 1}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
