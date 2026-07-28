'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface BranchContextType {
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
  isBranchMatching: (branchCodesOrIds: string[] | string) => boolean;
}

const BranchContext = createContext<BranchContextType>({
  selectedBranchId: 'ALL',
  setSelectedBranchId: () => {},
  isBranchMatching: () => true,
});

export const BranchProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');

  useEffect(() => {
    const saved = localStorage.getItem('susrutha_selected_branch');
    if (saved) setSelectedBranchId(saved);
  }, []);

  const handleSetBranch = (id: string) => {
    setSelectedBranchId(id);
    localStorage.setItem('susrutha_selected_branch', id);
  };

  const isBranchMatching = (branchCodesOrIds: string[] | string): boolean => {
    if (selectedBranchId === 'ALL') return true;
    if (Array.isArray(branchCodesOrIds)) {
      return branchCodesOrIds.some(
        (b) =>
          b.toUpperCase().includes(selectedBranchId.toUpperCase()) ||
          selectedBranchId.toUpperCase().includes(b.toUpperCase())
      );
    }
    return (
      branchCodesOrIds.toUpperCase().includes(selectedBranchId.toUpperCase()) ||
      selectedBranchId.toUpperCase().includes(branchCodesOrIds.toUpperCase())
    );
  };

  return (
    <BranchContext.Provider
      value={{
        selectedBranchId,
        setSelectedBranchId: handleSetBranch,
        isBranchMatching,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => useContext(BranchContext);
