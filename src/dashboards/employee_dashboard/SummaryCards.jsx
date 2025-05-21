import React from "react";

const SummaryCards = ({ total, approved, pending, rejected, onFilter, activeFilter }) => {
  const cardData = [
    { 
      label: "Total Requests", 
      count: total, 
      status: "ALL",
      borderColor: "border-indigo-500",
      activeBg: "bg-indigo-50"
    },
    { 
      label: "Approved", 
      count: approved, 
      status: "APPROVED",
      borderColor: "border-green-500",
      activeBg: "bg-green-50"
    },
    { 
      label: "Pending", 
      count: pending, 
      status: "PENDING",
      borderColor: "border-orange-500",
      activeBg: "bg-orange-50"
    },
    { 
      label: "Rejected", 
      count: rejected, 
      status: "REJECTED",
      borderColor: "border-red-500",
      activeBg: "bg-red-100"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 " >
      {cardData.map((card) => (
        <div 
          key={card.status}
          onClick={() => onFilter(card.status)}
          className={` p-6 rounded-xl shadow-sm border-b-4 ${card.borderColor} cursor-pointer transition-all ${
            activeFilter === card.status ? card.activeBg + ' transform scale-[1.02] shadow-md' : 'hover:shadow-md'
          }`}
        >
          <div className="text-gray-500 text-sm font-medium">{card.label}</div>
          <div className="text-3xl font-light mt-2">{card.count}</div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;