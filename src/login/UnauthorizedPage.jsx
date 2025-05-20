// UnauthorizedPage.js
const UnauthorizedPage = () => {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-700 text-lg">You do not have permission to view this page.</p>
      </div>
    );
  };
  
  export default UnauthorizedPage;
  