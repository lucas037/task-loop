"use client";

import { useState } from "react";
import Image from "next/image";
import { useSignInWithEmailAndPassword } from "react-firebase-hooks/auth";
import { auth } from "../services/firebaseConfig";

export default function Login() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("-");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("-");
  const [signInWithEmailAndPassword] = useSignInWithEmailAndPassword(auth);

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

    if (validEmail && validPassword) {
        signInWithEmailAndPassword(email, password)
        .then(() => {
            window.location.href = "/";
        })
        .catch((error) => {
          console.error("Error creating user:", error);
          if (error.code === 'auth/email-already-in-use') {
            setEmailError("Email already in use.");
          } else {
            setEmailError("An error occurred.");
          }
        });
    }
  }

  return (
    <main className="h-screen flex justify-center items-center">
      <div className="border-1 rounded-xl w-[90vw] max-w-[800px] flex flex-col items-center pb-8 gap-16">
        <div className="w-full flex flex-col items-center justify-center">
          <Image src="/logo.png" alt="logo" width={150} height={150} />
          <span className="text-lg font-bold">Login</span>

        </div>
        
        <div className=" w-[90%] flex flex-col">
          <input
            placeholder="Email"
            onChange={(e) => {setEmail(e.target.value)}}
            className="border text-sm  h-[35px] rounded-sm pl-2">
          </input>
          <span
            className={`text-sm font-bold ml-1 mb-1 ${emailError === '-' ? "invisible": "text-red-600"}`}>
              {emailError}
          </span>

          <input
            placeholder="Password"
            type="password"
            onChange={(e) => {setPassword(e.target.value)}}
            onKeyDown={(e) => {if (e.key === 'Enter') handleLogin()}}
            className="border text-sm h-[35px] rounded-sm pl-2">
          </input>
          <span
            className={`text-sm font-bold ml-1 mb-1 ${passwordError === '-' ? "invisible": "text-red-600"}`}>
              {passwordError}
          </span>

          <div onClick={() => {handleLogin()}} className="bg-black text-lg h-[35px] text-white flex justify-center items-center rounded-lg cursor-pointer">Login</div>

          <div className="flex justify-center gap-1 mt-2">
            <span>Ainda não possui uma conta?</span>
            <span className="font-bold cursor-pointer underline" onClick={() => {window.location.href = "/sign-up";}}>Criar</span>
          </div>
        </div>

      </div>
    </main>
  );
}
