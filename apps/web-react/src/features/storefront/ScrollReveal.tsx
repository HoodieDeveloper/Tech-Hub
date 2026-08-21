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

  const [
    scrollingStarted,
    setScrollingStarted,
  ] = useState(false);

  /*
   * =========================================
   * WAIT FOR REAL PAGE SCROLL
   * =========================================
   */
  useEffect(() => {
    function handleScroll() {
      if (
        window.scrollY >= 30
      ) {
        setScrollingStarted(
          true,
        );
      }
    }

    window.addEventListener(
      'scroll',
      handleScroll,
      {
        passive: true,
      },
    );

    return () => {
      window.removeEventListener(
        'scroll',
        handleScroll,
      );
    };
  }, []);

  /*
   * =========================================
   * REVEAL WHEN ELEMENT ENTERS
   * THE VIEWPORT
   * =========================================
   */
  useEffect(() => {
    if (
      !scrollingStarted
    ) {
      return;
    }

    const element =
      elementRef.current;

    if (!element) {
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
            setVisible(
              true,
            );

            /*
             * Only animate once.
             */
            observer.unobserve(
              element,
            );
          }
        },
        {
          threshold: 0.05,

          /*
           * Reveal when the element
           * enters about the bottom
           * 85% of the screen.
           *
           * This also allows the
           * Benefits and Footer to
           * appear near the end of
           * the page.
           */
          rootMargin:
            '0px 0px -15% 0px',
        },
      );

    observer.observe(
      element,
    );

    return () => {
      observer.disconnect();
    };
  }, [
    scrollingStarted,
  ]);

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
          visible
            ? `${delay}ms`
            : '0ms',
      }}
    >
      {children}
    </div>
  );
}