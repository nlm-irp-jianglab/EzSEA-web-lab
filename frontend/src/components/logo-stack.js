/**
 * logo-stack.js
 * This file is the component that displays sequence logos
 * Here is the structure of this component:
 *  <LogoStack>
 *     <DndLogo> - This layer ensures that logos are drag and droppable for easy reordering
 *       <Logo> - This layer is responsible for rendering the logos, and contains most of the logic.
 *     </DndLogo>
 *     <DndLogo>... More logos 
 * </LogoStack>   
 */
import React, { useState, useRef, useEffect, useImperativeHandle, useContext, useMemo, useCallback } from "react";
import { EasyScroller } from 'easyscroller';
import "./logojs.css";
import { tolContext } from '../components/tolContext';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndLogo } from './dndLogo.js';
import { LogoProvider } from './logoContext.js';

const LogoStack = React.forwardRef(({
  onColumnClick,
  onColumnHover,
  importantResiduesList,
  removeNodeHandle,
  applyEntropyStructColor,
  applyImportantStructColor,
  findAndZoom
}, ref) => {
  const logoRefs = useRef([]);
  const scrollersRef = useRef({
    back: [],
    front: []
  });

  const [renderLogos, setRenderLogos] = useState(false);
  const {
    scrollPosition,
    setScrollPosition,
    seqLength,
    logoContent,
    setLogoContent
  } = useContext(tolContext);

  // Memoize rect size calculation
  const rectSize = useMemo(() =>
    seqLength > 999 ? 20 : 21.5
    , [seqLength]);

  // Optimize logo ref management
  const addLogoRef = useCallback((ref) => {
    if (ref && !logoRefs.current.includes(ref)) {
      logoRefs.current = [...logoRefs.current, ref];
      initializeScrollers();
    }
  }, []);

  // Memoize scroller configuration
  const scrollerConfig = useMemo(() => ({
    scrollingX: true,
    scrollingY: false,
    animating: false,
    zooming: 0,
    minZoom: 1,
    maxZoom: 1,
    bouncing: false
  }), []);

  // Initialize scrollers more efficiently
  const initializeScrollers = useCallback(() => {
    // Cleanup existing scrollers
    cleanupScrollers();

    logoRefs.current.forEach((ref) => {
      const backScroller = new EasyScroller(ref, scrollerConfig);
      const frontScroller = new EasyScroller(ref, scrollerConfig);

      scrollersRef.current.back.push(backScroller);
      scrollersRef.current.front.push(frontScroller);
    });

    // Set up scroll synchronization
    scrollersRef.current.back.forEach((curr, index) => {
      curr.scroller.__callback = (left) => {
        synchronizeScroll(left, index);
      };
    });
  }, [scrollerConfig]);

  // Add debounce utility to optimize scrolling performance
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Add the debounced function
  const debouncedSetScrollPosition = useMemo(
    () => debounce((position) => {
      setScrollPosition(position);
    }, 150), // Adjust timeout as needed
    [setScrollPosition]
  );

  // Optimize scroll synchronization
  const synchronizeScroll = useCallback((left, sourceIndex) => {
    // Update other back scrollers
    scrollersRef.current.back.forEach((scroller, index) => {
      if (index !== sourceIndex) {
        scroller.scroller.__scrollLeft = left;
      }
    });

    // Update front scrollers
    scrollersRef.current.front.forEach((scroller, index) => {
      if (index !== sourceIndex) {
        scroller.scroller.__publish(left, 0, 1, true);
      }
    });

    // Update y-axis positions
    requestAnimationFrame(() => {
      const elements = document.getElementsByClassName('yaxis');
      const translationValue = left / 4.7603;
      Array.from(elements).forEach((element) => {
        element.style.transform = `translate(${translationValue}em, 10px)`;
      });
    });

    // Debounce the scroll position update
    debouncedSetScrollPosition(Math.floor(left / rectSize));
  }, [rectSize]);

  // Efficient cleanup
  const cleanupScrollers = useCallback(() => {
    Object.values(scrollersRef.current).flat().forEach(scroller => {
      scroller?.destroy?.();
    });
    scrollersRef.current = { back: [], front: [] };
  }, []);

  // Optimize logo removal
  const removeLogo = useCallback((logoHeader) => {
    setLogoContent(prev => {
      const newContent = { ...prev };
      delete newContent[logoHeader];
      return newContent;
    });
    removeNodeHandle(logoHeader);
  }, [removeNodeHandle, setLogoContent]);

  // Initialize component
  useEffect(() => {
    if (!logoContent) {
      console.error('No logoContent provided to render Logo');
      return;
    }

    logoRefs.current = [];
    setRenderLogos(true);

    return cleanupScrollers;
  }, [logoContent, cleanupScrollers]);

  // Handles scrolling from the Slider component
  const scrollToIndex = useCallback((index) => {
    // Update context scroll position
    setScrollPosition(index);

    // Update scrollers
    scrollersRef.current.back.forEach((scroller) => {
      scroller.scroller.__publish(index * rectSize, 1, 1, true);
    });

    // Update front scroller when only one back scroller exists
    if (scrollersRef.current.back.length === 1) {
      scrollersRef.current.front[0].scroller.__publish(index * rectSize, 1, 1, true);
    }
  }, [rectSize, setScrollPosition]);

  // Expose scroll methods through ref
  useImperativeHandle(ref, () => ({
    scrollToHighlightIndex: (index) => {
      const centerOffset = logoRefs.current[0]?.parentNode?.clientWidth / 2 || 0;
      const targetPosition = index * rectSize - centerOffset;

      // Pulse animation for target residue
      logoRefs.current.forEach(ref => {
        try {
          const target = ref.firstChild.firstChild.children[index - 1]?.lastChild;
          if (!target) return;

          target.style.transition = "fill-opacity 0.3s ease";
          let pulseCount = 0;

          const pulseInterval = setInterval(() => {
            target.style.fillOpacity = target.style.fillOpacity === "0.3" ? "0" : "0.3";
            if (++pulseCount >= 6) {
              clearInterval(pulseInterval);
              target.style.fillOpacity = "0";
            }
          }, 300);
        } catch (e) {
          console.error('Error highlighting residue:', e);
        }
      });

      // Synchronize scroll position
      scrollersRef.current.back.forEach(scroller => {
        scroller.scroller.__publish(targetPosition, 1, 1, true);
      });

      if (scrollersRef.current.back.length === 1) {
        scrollersRef.current.front[0]?.scroller.__publish(targetPosition, 1, 1, true);
      }
    },
    scrollToIndex,
  }), [rectSize]);

  return (
    <div style={{ overflowX: 'hidden' }}>
      <LogoProvider>
        {renderLogos ? (
          <DndProvider backend={HTML5Backend}>
            <DndLogo
              logoContent={logoContent}
              applyEntropyStructColor={applyEntropyStructColor}
              onSymbolClick={onColumnClick}
              onSymbolHover={onColumnHover}
              importantResiduesList={importantResiduesList}
              applyImportantStructColor={applyImportantStructColor}
              removeLogo={removeLogo}
              findAndZoom={findAndZoom}
              addLogoRef={addLogoRef}
            />
          </DndProvider>
        ) : (
          <p>Loading...</p>
        )}
      </LogoProvider>
    </div>
  );
});

export default React.memo(LogoStack);
