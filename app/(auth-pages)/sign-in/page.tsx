import Link from "next/link";
import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";

export default async function SignIn(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;

  return (
    <div
      className="min-h-screen w-screen flex items-center justify-center bg-no-repeat bg-cover bg-center px-6"
      style={{ backgroundImage: "url('/sign-in-bg.jpg')" }}
    >
      <form
        className="w-full max-w-md flex flex-col gap-6 items-center justify-center"
        action={signInAction}
      >
        <h1 className="text-4xl text-center font-sans">Sign In</h1>

        <div className="w-full">
          <label htmlFor="email" className="text-sm text-gray-600">
            Email
          </label>
          <input
            type="email"
            name="email"
            required
            className="w-full mt-1 p-3 border rounded-lg bg-gray-100 focus:outline-none"
          />
        </div>

        <div className="w-full relative">
          <label htmlFor="password" className="text-sm text-gray-600">
            Password
          </label>
          <input
            type="password"
            name="password"
            required
            className="w-full mt-1 p-3 border rounded-lg bg-gray-100 focus:outline-none pr-10"
          />
          <span className="absolute right-3 bottom-3.5 cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 text-gray-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.98 8.223A10.477 10.477 0 001.5 12c2.003 3.705 5.78 6.5 10.5 6.5s8.497-2.795 10.5-6.5A10.477 10.477 0 0020.02 8.223M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </span>
        </div>

        {'error' in searchParams && typeof searchParams.error === 'string' && (
          <p className="text-sm text-red-600 text-center">{searchParams.error}</p>
        )}

        <button
          type="submit"
          formAction={signInAction}
          data-pending-text="Signing in..."
          className="w-full bg-[#50BFDE] hover:bg-[#45abc6] text-white py-3 rounded-full font-semibold"
        >
          Continue
        </button>

        <FormMessage message={searchParams} />

        <p className="text-sm text-gray-600 text-center">
          Don't have an account?{' '}
          <Link href="/sign-up" className="text-[#50BFDE] hover:underline">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
}
