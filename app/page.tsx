"use client";

import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("-");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("-");

  const validateEmail = () => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleLogin = () => {
    setEmailError("-");
    setPasswordError("-");
    let validEmail = false;
    let validPassword = false;

    if (email === "")
      setEmailError("Email is required.");
    else if (validateEmail() == false)
      setEmailError("Email is not valid.");
    else
      validEmail = true;
    

    if (password === "")
      setPasswordError("Password is required.");
    else if (password.length < 5)
      setPasswordError("Password must be at least 5 characters.");
    else
      validPassword = true;
  }

  return (
    <main className="h-screen flex justify-center items-center">
      <div className="border-1 rounded-xl w-[80vw] h-[80vw] max-w-[500px] max-h-[500px] flex flex-col items-center justify-around">
        <span className="text-lg font-bold">Sign Up</span>
        
        <div className=" w-[90%] flex flex-col">
          <input
            placeholder="Email"
            onChange={(e) => {setEmail(e.target.value)}}
            className="bg-gray-100 text-sm  h-[35px] rounded-sm pl-2">
          </input>
          <span
            className={`text-xs font-bold ml-2 mb-1 ${emailError === '-' ? "invisible": "text-red-600"}`}>
              {emailError}
          </span>

          <input
            placeholder="Password"
            type="password"
            onChange={(e) => {setPassword(e.target.value)}}
            onKeyDown={(e) => {if (e.key === 'Enter') handleLogin()}}
            className="bg-gray-200 text-sm h-[35px] rounded-sm pl-2">
          </input>
          <span
            className={`text-xs font-bold ml-2 mb-1 ${passwordError === '-' ? "invisible": "text-red-600"}`}>
              {passwordError}
          </span>

          <div onClick={() => {handleLogin()}} className="bg-black text-lg h-[35px] text-white flex justify-center items-center rounded-lg cursor-pointer">Login</div>
        </div>

        <div></div>
        
      </div>
    </main>
  );
}
