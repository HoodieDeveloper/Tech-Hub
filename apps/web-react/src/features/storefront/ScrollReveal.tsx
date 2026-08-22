import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

import './ScrollReveal.css';

type Props = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

export function ScrollReveal({
  children,
  delay = 0,
  className = '',
}: Props) {
  const elementRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const [
    visible,
    setVisible,
  ] = useState(false);

  useEffect(() => {
    const element =
      elementRef.current;

    if (!element) {
      return;
    }

    if (
      !(
        'IntersectionObserver' in
        window
      )
    ) {
      setVisible(true);
      return;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          const entry =
            entries[0];

          if (
            entry.isIntersecting
          ) {
            setVisible(true);
            observer.unobserve(
              element,
            );
          }
        },
        {
          threshold: 0.08,
          rootMargin:
            '0px 0px -8% 0px',
        },
      );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={elementRef}
      className={[
        'scroll-reveal',
        visible
          ? 'scroll-reveal-visible'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        transitionDelay:
          `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
