// app/login/page.tsx
import Image from "next/image";
import AuthForm from "../../components/AuthForm";
import logo from "@/assets/logo.png";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Left Side - Branding (hidden on mobile/tablet, visible on desktop) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 items-center justify-center p-6 lg:p-8 xl:p-12">
        <div className="text-center space-y-2 lg:space-y-2 xl:space-y-2 max-w-sm lg:max-w-md xl:max-w-lg">
          {/* Logo/Brand */}
          <div className="relative">
            <div className="w-52 h-52 lg:w-72 lg:h-72 xl:w-72 xl:h-72 mx-auto flex items-center justify-center">
              <Image
                src={logo}
                alt="TradeFlow Logo"
                width={288}
                height={288}
                priority
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          
          {/* App Name */}
          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent -mt-2 lg:-mt-3 xl:-mt-4">
            TradeFlow
          </h1>
          
          {/* Tagline */}
          <p className="text-lg lg:text-xl xl:text-2xl text-slate-600 font-medium leading-relaxed px-2 pt-2 lg:pt-3">
            Streamline your trading experience with intelligent analytics and seamless execution
          </p>
          
          {/* Feature highlights */}
          <div className="space-y-3 lg:space-y-4 pt-6 lg:pt-8">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
              <span className="text-sm lg:text-base text-slate-700 font-medium">Real-time market data</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"></div>
              <span className="text-sm lg:text-base text-slate-700 font-medium">Advanced portfolio analytics</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
              <span className="text-sm lg:text-base text-slate-700 font-medium">Secure trading environment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex w-full lg:w-1/2 xl:w-2/5 items-center justify-center p-4 sm:p-6 md:p-8 lg:p-6 xl:p-8">
        <div className="max-w-xs sm:max-w-sm md:max-w-md w-full space-y-6 md:space-y-8">
          {/* Mobile/Tablet branding (visible on mobile/tablet, hidden on desktop) */}
          <div className="text-center lg:hidden mb-3 md:mb-4">
            <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 mx-auto flex items-center justify-center mb-1 md:mb-2">
              <Image
                src={logo}
                alt="TradeFlow Logo"
                width={160}
                height={160}
                priority
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent -mt-1 md:-mt-2">
              TradeFlow
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-slate-600 mt-1 md:mt-2 px-4">
              Your intelligent trading companion
            </p>
          </div>
          
          {/* Welcome message */}
          <div className="text-center space-y-1 md:space-y-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-2xl font-bold text-slate-800">
              Welcome back
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-base text-slate-600">
              Sign in to continue your trading journey
            </p>
          </div>
          
          {/* Auth Form */}
          <div className="w-full">
            <AuthForm />
          </div>
          
          {/* Security badge */}
          <div className="text-center pt-3 md:pt-4">
            <div className="inline-flex items-center space-x-2 text-xs sm:text-sm text-slate-500">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
              <span>256-bit SSL encrypted</span>
            </div>
          </div>

          {/* Mobile feature highlights (visible only on mobile) */}
          <div className="block sm:hidden space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
              <span className="text-xs text-slate-600">Real-time data</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-1.5 h-1.5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"></div>
              <span className="text-xs text-slate-600">Portfolio analytics</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-1.5 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
              <span className="text-xs text-slate-600">Secure trading</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
