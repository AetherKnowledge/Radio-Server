"use client";

import { signIn } from "@/lib/auth-client";
import { motion } from "motion/react";
import { useState } from "react";
import { FaLock } from "react-icons/fa";
import { MdLock, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { usePopup } from "../Popup/PopupProvider";
import { DEFAULT_EMAIL } from "@/app/constants/defaultEmail";

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const Login = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const statusPopup = usePopup();

  async function handleLoginSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    await signIn.email(
      {
        email: DEFAULT_EMAIL,
        password,
        callbackURL: "/",
      },
      {
        onError: (ctx) => {
          statusPopup.showError(ctx.error.message || "Login failed");
        },
      }
    );

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-base-200 via-base-100 to-base-200 px-4 py-10 text-base-content">
      <div className="w-full max-w-md">
        <motion.div
          className="rounded-3xl bg-base-100/80 backdrop-blur-sm border border-base-300/50 shadow-2xl px-6 py-8 sm:px-10 sm:py-12"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block mb-4"
            >
              <div className="w-16 h-16 mx-auto bg-linear-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
                <MdLock className="text-3xl text-primary-content" />
              </div>
            </motion.div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent pb-1">
              Admin Login
            </h1>
            <p className="text-sm text-base-content/70">
              Enter your credentials to access the dashboard
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {/* Password Field */}
            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-base-content/90"
                htmlFor="password"
              >
                Password
              </label>

              <label className="input input-bordered input-lg w-full pl-12 pr-12 text-sm focus:input-primary transition-all">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-base-content/50">
                  <MdLock size={20} className="text-primary/70" />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="grow"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-4 flex items-center text-base-content/50 hover:text-primary transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <MdVisibilityOff size={20} />
                  ) : (
                    <MdVisibility size={20} />
                  )}
                </button>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg w-full mt-6 flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <FaLock size={18} />
                  <span>Log In</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-xs text-center text-base-content/60">
            Protected access for administrators only
          </p>
        </motion.div>

        {/* Back to Home Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center"
        >
          <a
            href="/"
            className="text-sm text-base-content/70 hover:text-primary transition-colors inline-flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
            Back to Home
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
