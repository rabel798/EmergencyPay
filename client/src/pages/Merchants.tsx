import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import StatusBar from '@/components/StatusBar';
import MerchantItem from '@/components/MerchantItem';
import { useLocation, useSearch } from 'wouter';

const Merchants: React.FC = () => {
  const { merchants, essentialServices } = useAppContext();
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const categoryFilter = params.get('category');
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryFilter);
  
  // Filter merchants by category if selected
  const filteredMerchants = selectedCategory 
    ? merchants.filter(m => m.category === selectedCategory)
    : merchants;
  
  const handleCategorySelect = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
  };
  
  const handleSelectMerchant = (merchant: typeof merchants[0]) => {
    navigate(`/payment-amount/${merchant.id}`);
  };

  return (
    <motion.div 
      className="flex-1 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <StatusBar />
      
      <div className="flex-1 overflow-auto scrollbar-hide pb-20">
        <div className="px-4 py-6">
          <h1 className="text-2xl font-semibold">Merchants</h1>
          <p className="text-gray-600 mt-1">Find essential service providers</p>
        </div>
        
        <div className="px-4 mb-6">
          <h3 className="text-lg font-medium mb-3">Categories</h3>
          <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2">
            {essentialServices.map((service) => (
              <button
                key={service.id}
                onClick={() => handleCategorySelect(service.category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  selectedCategory === service.category
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <i className={`${service.icon} mr-1`}></i>
                {service.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className="px-4 pb-24">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">
              {selectedCategory 
                ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Services`
                : 'All Merchants'}
            </h3>
            {selectedCategory && (
              <button 
                className="text-primary text-sm"
                onClick={() => setSelectedCategory(null)}
              >
                Show All
              </button>
            )}
          </div>
          
          <div className="space-y-3">
            {filteredMerchants.length > 0 ? (
              filteredMerchants.map((merchant, index) => (
                <MerchantItem 
                  key={merchant.id} 
                  merchant={merchant}
                  index={index}
                  onConnect={() => handleSelectMerchant(merchant)}
                />
              ))
            ) : (
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No merchants found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Merchants;
