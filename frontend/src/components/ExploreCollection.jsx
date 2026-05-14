import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "./ExploreCollection.css";
import Loader from "./Loader"; 

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

// Helper: construct absolute image URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  let baseUrl = API_URL.replace(/\/api\/?$/, "");
  if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);
  const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${baseUrl}${cleanPath}`;
};

// Image component with loading state
const LazyImage = ({ src, alt, className, onError, draggable, index }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className="lazy-category-image-container">
      {isLoading && <Loader fullPage={false} />}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'img-loading' : 'img-loaded'}`}
        style={{ 
          opacity: isLoading ? 0 : 1,
          transition: "opacity 0.4s ease-in-out" 
        }}
        draggable={draggable}
        onLoad={() => setIsLoading(false)}
        onError={(e) => {
          setError(true);
          setIsLoading(false);
          if (onError) onError(e);
        }}
        loading={index < 6 ? "eager" : "lazy"}
        fetchPriority={index < 6 ? "high" : "low"}
        decoding="async"
      />
      {error && !isLoading && (
        <div className="category-image-fallback">
          <i className="bi bi-image"></i>
          <span>{alt || `Category ${index + 1}`}</span>
        </div>
      )}
    </div>
  );
};

// Loading skeleton component
const CollectionSkeleton = () => {
  const skeletonCount = 8;
  
  return (
    <section className="collection-section">
      <div className="royal-bg-pattern"></div>
      <div className="container">
        <div className="collection-header">
          <div className="skeleton-tag"></div>
          <div className="skeleton-title"></div>
          <div className="skeleton-divider"></div>
          <div className="skeleton-subtitle"></div>
        </div>
      </div>
      
      <div className="collection-scroll-container">
        <div className="collection-track skeleton-track">
          {[...Array(skeletonCount)].map((_, index) => (
            <div key={index} className="category-card-skeleton arch-style-skeleton">
              <div className="arch-border-frame-skeleton"></div>
              <div className="skeleton-image"></div>
              <div className="category-overlay-skeleton">
                <div className="skeleton-category-title"></div>
                <div className="skeleton-explore-text"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ExploreCollection = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState({});

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/categories`);
        if (response.data.success) {
          setCategories(response.data.categories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleImageLoad = (categoryId) => {
    setImagesLoaded(prev => ({ ...prev, [categoryId]: true }));
  };

  if (loading) {
    return window.innerWidth <= 768 ? <Loader /> : <CollectionSkeleton />;
  }

  if (categories.length === 0) return null;

  // Use 4 sets for a perfectly continuous loop on large screens
  const duplicatedCategories = [...categories, ...categories, ...categories, ...categories];

  return (
    <section className="collection-section">
      <div className="royal-bg-pattern"></div>
      <div className="container">
        <div className="collection-header">
          <span className="collection-royal-tag">Premium Edition</span>
          <h2 className="section-title">Explore our Collections</h2>
          <div className="section-divider"></div>
          <p className="section-subtitle">
            Curated pieces of timeless tradition and royal handloom artistry.
          </p>
        </div>
      </div>

      <div className="collection-scroll-container">
         {/* Track items extracted for reuse in fallback */}
         {(() => {
           const trackContent = duplicatedCategories.map((item, index) => {
             const imageUrl = getImageUrl(item.image_url);
             return (
               <Link 
                 to={`/all-products?category=${encodeURIComponent(item.name)}`} 
                 key={`${item.id}-${index}`} 
                 className="category-card-link"
                 onDragStart={(e) => e.preventDefault()}
               >
                 <div className="category-card arch-style">
                   <div className="arch-border-frame"></div>
                   <LazyImage 
                     src={imageUrl || `/assets/arch${(index % 4) + 1}.png`} 
                     alt={item.name} 
                     className="category-image"
                     draggable="false"
                     loading={index < 4 ? "eager" : "lazy"}
                     onError={(e) => {
                       e.target.src = `/assets/arch${(index % 4) + 1}.png`;
                     }}
                   />
                   <div className="category-overlay-arch">
                     <h5 className="category-title">{item.name}</h5>
                     <span className="explore-text">Explore Collection <i className="bi bi-chevron-right"></i></span>
                   </div>
                 </div>
               </Link>
             );
           });
 
           return motion && motion.div ? (
             <motion.div 
               className="collection-track"
               drag="x"
               dragConstraints={{ left: -3000, right: 0 }}
               animate={{ x: ["0%", "-25%"] }}
               transition={{
                 x: {
                   repeat: Infinity,
                   repeatType: "loop",
                   duration: 25,
                   ease: "linear",
                 },
               }}
               whileTap={{ cursor: "grabbing" }}
               style={{ x: 0, display: "flex" }}
             >
               {trackContent}
             </motion.div>
           ) : (
             <div className="collection-track" style={{ display: "flex", overflowX: "auto" }}>
               {trackContent}
             </div>
           );
         })()}
       </div>
     </section>
   );
 };


export default ExploreCollection;