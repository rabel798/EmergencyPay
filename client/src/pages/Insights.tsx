import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import StatusBar from '@/components/StatusBar';
import { useAppContext } from '@/context/AppContext';
import { 
  PieChart, Pie, Cell, BarChart, Bar, 
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const Insights: React.FC = () => {
  const { transactions, currentUser, connectionStatus } = useAppContext();
  const [activeTab, setActiveTab] = useState<'spending' | 'emergency' | 'trends'>('spending');

  // Calculate spending by category
  const getSpendingByCategory = () => {
    const categoryMap = new Map<string, number>();
    
    transactions.forEach(txn => {
      if (txn.sender_id === currentUser?.id) {
        // Get merchant category or default to method if not available
        const category = txn.method || 'Other';
        const amount = parseFloat(txn.amount);
        
        if (categoryMap.has(category)) {
          categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
        } else {
          categoryMap.set(category, amount);
        }
      }
    });
    
    return Array.from(categoryMap).map(([name, value]) => ({ name, value }));
  };

  // Calculate emergency readiness score (0-100)
  const getEmergencyReadinessScore = () => {
    if (!currentUser) return 0;
    
    const emergencyBalance = parseFloat(currentUser.emergency_balance);
    const totalBalance = parseFloat(currentUser.balance) + emergencyBalance;
    
    // Score based on emergency balance percentage, offline transaction history, and recent activity
    const balanceScore = Math.min(60, (emergencyBalance / (totalBalance || 1)) * 100);
    const offlineTransactionsScore = Math.min(
      20, 
      (transactions.filter(t => t.is_offline).length / Math.max(transactions.length, 1)) * 40
    );
    const recentActivityScore = transactions.length > 0 ? 20 : 0;
    
    return Math.round(balanceScore + offlineTransactionsScore + recentActivityScore);
  };

  // Calculate monthly trends
  const getMonthlyTrends = () => {
    const last6Months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = month.toLocaleString('default', { month: 'short' });
      last6Months.push({ month, monthName });
    }
    
    return last6Months.map(({ month, monthName }) => {
      const monthStart = new Date(month);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      const monthlyTransactions = transactions.filter(txn => {
        const txnDate = new Date(txn.timestamp || 0);
        return txnDate >= monthStart && txnDate <= monthEnd && txn.sender_id === currentUser?.id;
      });
      
      const regular = monthlyTransactions
        .filter(txn => !txn.is_offline)
        .reduce((sum, txn) => sum + parseFloat(txn.amount), 0);
        
      const emergency = monthlyTransactions
        .filter(txn => txn.is_offline)
        .reduce((sum, txn) => sum + parseFloat(txn.amount), 0);
      
      return {
        name: monthName,
        'Regular': regular.toFixed(2),
        'Emergency': emergency.toFixed(2),
      };
    });
  };

  const spendingData = getSpendingByCategory();
  const readinessScore = getEmergencyReadinessScore();
  const monthlyTrends = getMonthlyTrends();
  
  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <motion.div
      className="flex-1 flex flex-col min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <StatusBar />
      
      <div className="flex-1 overflow-auto scrollbar-hide pb-20">
        <div className="p-4">
          <div className="flex items-center mb-4">
            <Link href="/">
              <button className="h-10 w-10 mr-3 rounded-full hover:bg-gray-100 flex items-center justify-center">
                <i className="ri-arrow-left-line text-xl"></i>
              </button>
            </Link>
            <h1 className="text-2xl font-bold">Insights</h1>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex border-b mb-6 overflow-x-auto scrollbar-hide">
            <button
              className={`py-3 px-4 font-medium text-sm whitespace-nowrap ${activeTab === 'spending' ? 'text-primary border-b-2 border-primary' : 'text-gray-600'}`}
              onClick={() => setActiveTab('spending')}
            >
              <i className="ri-pie-chart-line mr-1"></i> Spending Analysis
            </button>
            <button
              className={`py-3 px-4 font-medium text-sm whitespace-nowrap ${activeTab === 'emergency' ? 'text-primary border-b-2 border-primary' : 'text-gray-600'}`}
              onClick={() => setActiveTab('emergency')}
            >
              <i className="ri-shield-flash-line mr-1"></i> Emergency Readiness
            </button>
            <button
              className={`py-3 px-4 font-medium text-sm whitespace-nowrap ${activeTab === 'trends' ? 'text-primary border-b-2 border-primary' : 'text-gray-600'}`}
              onClick={() => setActiveTab('trends')}
            >
              <i className="ri-line-chart-line mr-1"></i> Payment Trends
            </button>
          </div>
          
          {/* Spending Analysis */}
          {activeTab === 'spending' && (
            <div>
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Spending by Category</h3>
                  <div className="bg-primary-50 text-primary text-xs font-medium px-2 py-1 rounded-full">
                    Last 30 days
                  </div>
                </div>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={spendingData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={30}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={2}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {spendingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${Number(value).toFixed(2)}`} />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {spendingData.length > 0 ? (
                  <div className="mt-2 border-t pt-3 space-y-2">
                    {spendingData.sort((a, b) => b.value - a.value).slice(0, 3).map((category, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <span className="text-sm">{category.name}</span>
                        </div>
                        <span className="text-sm font-medium">₹{Number(category.value).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 mt-2">
                    No spending data available
                  </div>
                )}
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <h3 className="text-lg font-medium mb-4">Financial Insights</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg col-span-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                          <i className="ri-wallet-3-line text-lg text-primary"></i>
                        </div>
                        <div>
                          <p className="font-medium">Total Spending</p>
                          <p className="text-gray-600 text-sm">Last 30 days</p>
                        </div>
                      </div>
                      <p className="font-bold text-xl">
                        ₹{spendingData.reduce((sum, item) => sum + Number(item.value), 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center mb-1">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
                        <i className="ri-bar-chart-line text-md text-green-600"></i>
                      </div>
                      <p className="font-medium">Average Transaction</p>
                    </div>
                    <p className="text-lg font-semibold mt-1">
                      ₹{transactions.length > 0 
                          ? (transactions
                              .filter(t => t.sender_id === currentUser?.id)
                              .reduce((sum, t) => sum + parseFloat(t.amount), 0) / 
                              Math.max(1, transactions.filter(t => t.sender_id === currentUser?.id).length)).toFixed(2)
                          : '0.00'
                      }
                    </p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center mb-1">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                        <i className="ri-calendar-line text-md text-blue-600"></i>
                      </div>
                      <p className="font-medium">Frequency</p>
                    </div>
                    <p className="text-lg font-semibold mt-1">
                      {transactions.filter(t => t.sender_id === currentUser?.id).length > 0 
                        ? (transactions.filter(t => t.sender_id === currentUser?.id).length / 30).toFixed(1) 
                        : '0'} per day
                    </p>
                  </div>
                  
                  {spendingData.length > 0 && (
                    <div className="p-3 bg-gray-50 rounded-lg col-span-2">
                      <div className="flex items-center mb-2">
                        <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center mr-2">
                          <i className="ri-line-chart-line text-md text-amber-600"></i>
                        </div>
                        <p className="font-medium">Spending Pattern</p>
                      </div>
                      
                      <div className="mt-1">
                        <div className="flex items-center mb-1">
                          <span className="text-sm text-gray-600 w-24">UPI</span>
                          <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-blue-500 h-full rounded-full"
                              style={{ 
                                width: `${Math.min(100, (transactions.filter(t => t.method === 'UPI').length / 
                                Math.max(1, transactions.length)) * 100)}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium ml-2 w-10 text-right">
                            {Math.round((transactions.filter(t => t.method === 'UPI').length / 
                              Math.max(1, transactions.length)) * 100)}%
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600 w-24">Bluetooth</span>
                          <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-orange-500 h-full rounded-full"
                              style={{ 
                                width: `${Math.min(100, (transactions.filter(t => t.method === 'BLUETOOTH').length / 
                                Math.max(1, transactions.length)) * 100)}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium ml-2 w-10 text-right">
                            {Math.round((transactions.filter(t => t.method === 'BLUETOOTH').length / 
                              Math.max(1, transactions.length)) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Emergency Readiness */}
          {activeTab === 'emergency' && (
            <div>
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <h3 className="text-lg font-medium mb-4">Emergency Readiness Score</h3>
                
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="relative h-44 w-44 flex items-center justify-center">
                    <svg className="transform -rotate-90" width="100%" height="100%" viewBox="0 0 120 120">
                      {/* Background circle */}
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        stroke="#e6e6e6"
                        strokeWidth="12"
                        fill="none"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        stroke={readinessScore > 70 ? '#22c55e' : readinessScore > 40 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray="339.292"
                        strokeDashoffset={339.292 * (1 - readinessScore / 100)}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold">{readinessScore}</span>
                      <span className="text-sm text-gray-500">out of 100</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 text-center">
                    <h4 className="font-medium text-lg">
                      {readinessScore > 70 ? 'Great!' : readinessScore > 40 ? 'Good' : 'Needs Improvement'}
                    </h4>
                    <p className="text-gray-600 mt-1 max-w-md">
                      {readinessScore > 70 
                        ? 'Your emergency preparedness is excellent. You have adequate emergency funds ready.'
                        : readinessScore > 40
                          ? 'You have a good emergency fund, but consider adding more for better protection.'
                          : 'Your emergency fund is low. Consider allocating more funds for emergencies.'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <h3 className="text-lg font-medium mb-2">Emergency Readiness Breakdown</h3>
                
                <div className="space-y-3 mt-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Emergency Balance</span>
                      <span className="text-sm text-gray-500">
                        ₹{currentUser?.emergency_balance || '0'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${readinessScore > 70 ? 'bg-green-500' : readinessScore > 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(100, (parseFloat(currentUser?.emergency_balance || '0') / 5000) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Offline Transactions</span>
                      <span className="text-sm text-gray-500">
                        {transactions.filter(t => t.is_offline).length} transactions
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, (transactions.filter(t => t.is_offline).length / 5) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Current Network Status</span>
                      <span className={`text-sm ${
                        connectionStatus === 'online' 
                          ? 'text-green-500' 
                          : connectionStatus === 'emergency'
                            ? 'text-red-500'
                            : 'text-amber-500'
                      }`}>
                        {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          connectionStatus === 'online' 
                            ? 'bg-green-500' 
                            : connectionStatus === 'emergency'
                              ? 'bg-red-500'
                              : 'bg-amber-500'
                        }`}
                        style={{ width: connectionStatus === 'online' ? '100%' : connectionStatus === 'offline' ? '50%' : '25%' }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Emergency Recommendations</h4>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-sm text-blue-800">
                        <i className="ri-information-line mr-1"></i>
                        Maintain at least 20% of your total balance as emergency funds to ensure you can make payments during network outages.
                      </p>
                    </div>
                    
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <div className="flex">
                        <i className="ri-flashlight-line text-amber-600 mt-0.5 mr-2 flex-shrink-0"></i>
                        <p className="text-sm text-amber-800">
                          Test emergency payments regularly by toggling emergency mode and making a small transaction to verify functionality.
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex">
                        <i className="ri-bluetooth-line text-green-600 mt-0.5 mr-2 flex-shrink-0"></i>
                        <p className="text-sm text-green-800">
                          Identify and save key merchants who support Bluetooth payments in your area for essential services during emergencies.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Monthly Trends */}
          {activeTab === 'trends' && (
            <div>
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <h3 className="text-lg font-medium mb-4">Monthly Spending Trends</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyTrends}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `₹${value}`} />
                      <Legend />
                      <Bar dataKey="Regular" stackId="a" fill="#8884d8" />
                      <Bar dataKey="Emergency" stackId="a" fill="#FF8042" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <h3 className="text-lg font-medium mb-2">Trend Insights</h3>
                
                <div className="space-y-3 mt-4">
                  {monthlyTrends.length > 0 && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <i className="ri-line-chart-line text-xl text-primary mr-3"></i>
                        <div>
                          <p className="font-medium">Monthly Average</p>
                          <p className="text-gray-600">
                            ₹{(monthlyTrends.reduce((sum, month) => 
                              sum + parseFloat(month.Regular) + parseFloat(month.Emergency), 0) / monthlyTrends.length
                            ).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <i className="ri-emergency-alert-line text-xl text-emergency-600 mr-3"></i>
                      <div>
                        <p className="font-medium">Emergency Transactions</p>
                        <p className="text-gray-600">
                          {transactions.filter(t => t.is_offline).length} transactions
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <i className="ri-bluetooth-line text-xl text-blue-600 mr-3"></i>
                      <div>
                        <p className="font-medium">Bluetooth Payments</p>
                        <p className="text-gray-600">
                          {transactions.filter(t => t.method === 'BLUETOOTH').length} transactions
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Insights;