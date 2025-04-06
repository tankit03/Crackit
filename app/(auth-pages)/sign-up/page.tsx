import Image from 'next/image';
import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from '@/components/form-message';

export default async function SignUp(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;

  return (
    <div
      className="min-h-screen w-screen bg-no-repeat bg-cover bg-center flex items-center justify-center p-6"
      style={{ backgroundImage: "url('/Login.jpg')" }}
    >
      {/* Left side with branding */}
      <div className="w-1/2 flex flex-col justify-center items-center p-10">
        <div className="mb-6">
          <Image
            src="/sign-up-logo.png"
            alt="CrackIt Logo"
            width={550}
            height={100}
          />
        </div>
        <h1 className="text-[4.5rem] text-center font-love">CrackIt</h1>
        <p className="text-lg mt-4 text-center max-w-md text-gray-700 text-[30px]">
          Crack difficult concepts with interactive quizzes
        </p>
      </div>

      {/* Right side with form */}
      <div className="w-1/2 flex flex-col justify-center px-16">
        <h2 className="text-[2rem] font-sans mb-[1rem] text-center">Create your account</h2>
        <form className="space-y-6" action={signUpAction}>
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            className="w-full p-3 border rounded-lg bg-gray-100 focus:outline-none"
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            className="w-full p-3 border rounded-lg bg-gray-100 focus:outline-none"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full p-3 border rounded-lg bg-gray-100 focus:outline-none"
          />
          <input
            type="text"
            name="university"
            placeholder="School"
            className="w-full p-3 border rounded-lg bg-gray-100 focus:outline-none"
          />
          <div className="relative">
            <input
              type="password"
              name="password"
              placeholder="Password"
              className="w-full p-3 border rounded-lg bg-gray-100 focus:outline-none pr-10 mb-[2rem]"
            />
            <span className="absolute right-3 top-3.5 cursor-pointer">
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

          <button
            type="submit"
            formAction={signUpAction}
            data-pending-text="Signing up..."
            className="w-full bg-[#50BFDE] hover:bg-[#45abc6] text-white py-3 rounded-full font-semibold mt-4"
          >
            Continue
          </button>

          <FormMessage message={searchParams} />
        </form>

        <p className="text-sm text-gray-600 mt-4 text-center">
          Already have an account?{' '}
          <a href="/sign-in" className="text-[#50BFDE] hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}