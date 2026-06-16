import React from 'react';
import { cn } from '../../utils/cn';

const FilterSidebar = ({ selectedFilter, onFilterChange, categories = [] }) => {
  const filterOptions = [
    { id: 'all', label: 'All Passwords' },
    { id: 'weak', label: 'Weak Passwords' },
    { id: 'old', label: 'Old Passwords' },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Filter
      </h3>

      <div className="space-y-3">
        {filterOptions.map((option) => (
          <label
            key={option.id}
            className={cn(
              'flex items-center space-x-3 cursor-pointer p-2 rounded-lg transition-colors duration-200',
              selectedFilter === option.id
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
            )}
          >
            <input
              type="radio"
              name="filter"
              value={option.id}
              checked={selectedFilter === option.id}
              onChange={(e) => onFilterChange(e.target.value)}
              className="sr-only"
            />
            <div
              className={cn(
                'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors duration-200',
                selectedFilter === option.id
                  ? 'border-primary-600 bg-primary-600'
                  : 'border-gray-300 dark:border-gray-600'
              )}
            >
              {selectedFilter === option.id && (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              )}
            </div>
            <span className="text-sm font-medium">{option.label}</span>
          </label>
        ))}

        {categories.length > 0 && (
          <div className="pt-2">
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Categories</div>
            {categories.map((c) => (
              <label
                key={c.id}
                className={cn(
                  'flex items-center space-x-3 cursor-pointer p-2 rounded-lg transition-colors duration-200',
                  selectedFilter === `cat:${c.id}`
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                )}
              >
                <input
                  type="radio"
                  name="filter"
                  value={`cat:${c.id}`}
                  checked={selectedFilter === `cat:${c.id}`}
                  onChange={(e) => onFilterChange(e.target.value)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors duration-200',
                    selectedFilter === `cat:${c.id}`
                      ? 'border-primary-600 bg-primary-600'
                      : 'border-gray-300 dark:border-gray-600'
                  )}
                >
                  {selectedFilter === `cat:${c.id}` && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <span className="text-sm font-medium">{c.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterSidebar;