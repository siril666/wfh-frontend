import React from "react";

const SummaryCards = ({ 
  total, 
  approved, 
  pending, 
  rejected,
  onFilter, 
  activeFilter 
}) => {
  const cardData = [
    { 
      label: "Total", 
      count: total, 
      status: "ALL",
      borderColor: "border-indigo-500",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600",
      activeBg: "bg-indigo-50"
    },
    { 
      label: "Approved", 
      count: approved, 
      status: "APPROVED",
      borderColor: "border-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      activeBg: "bg-green-50"
    },
    { 
      label: "Pending", 
      count: pending, 
      status: "PENDING",
      borderColor: "border-orange-500",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
      activeBg: "bg-orange-50"
    },
    { 
      label: "Rejected", 
      count: rejected, 
      status: "REJECTED",
      borderColor: "border-red-500",
      bgColor: "bg-red-100",
      textColor: "text-red-600",
      activeBg: "bg-red-100"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      {cardData.map((card) => (
        <button
          key={card.status}
          onClick={() => onFilter(card.status)}
          className={`p-6 rounded-xl shadow-sm border-b-4 ${card.borderColor} cursor-pointer transition-all duration-200
            ${activeFilter === card.status 
              ? `${card.activeBg} transform scale-[1.02] shadow-md` 
              : 'hover:shadow-md'}
          `}
        >
          <div className={`text-sm font-medium ${card.textColor}`}>{card.label}</div>
          <div className={`text-3xl font-light mt-2 ${card.textColor}`}>{card.count}</div>
        </button>
      ))}
    </div>
  );
};

export default SummaryCards;
