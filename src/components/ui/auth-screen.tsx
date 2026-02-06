

const AuthScreen = ({ onLogin }: { onLogin: () => void }) => {

  return (
    <div className="md:max-h-screen auth-container flex items-center justify-center relative overflow-hidden">

      {/* Main content - visible when modal is closed */}
      <div className="relative z-10 text-center max-w-md mt-16 mb-[63px]">
        {/* XEET Logo */}
        <div className="">
          <img src="/logo-title.svg" alt="XEET Logo" className="mx-auto w-48" />
          {/* Logo Icon */}
          <div className="w-64 mt-16 mx-auto">
            <img src="/hero-logo.svg" alt="XEET Logo Icon" className=" absolute" />
            <div className=" w-64 h-48 relative background-logo"></div>
          </div>
        </div>
        <h2 className="text-2xl text-white mt-8">
          Link your X account to get started
        </h2>
        <button
          onClick={onLogin}
          className="mx-auto button-primary h-14 w-44 mt-[38px] text-lg cursor-pointer"
        >
          Get started
        </button>
      </div>
    </div>
  );
};

export default AuthScreen;