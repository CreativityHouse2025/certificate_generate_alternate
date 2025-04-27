"use client"

import type React from "react"

import { useState } from "react"
import axios from "axios"
import Image from "next/image"
import { Input } from "./input"
import { Button } from "./button"

export default function Home() {
  const [fullName, setFullName] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Add this input handler for name validation
  const handleNameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
      .replace(/[\u0600-\u06FF]/g, '') // Remove Arabic characters
      .replace(/[^A-Za-z\s-]/g, '') // Allow only English letters, spaces, and hyphens
      .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter after space/beginning
  
    setFullName(value);
  };


  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !email) return

    setLoading(true)
    setSuccess(false)

    try {
      const formData = new FormData()
      formData.append("fullName", fullName)
      formData.append("email", email)

      const response = await axios.post("/api", formData, {
        responseType: "blob",
      })

      // Trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "certificate.pdf")
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setSuccess(true)
    } catch (error) {
      console.error("Certificate generation error:", error)
      alert("Error generating certificate. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image src="/images/background.jpg" alt="Background" fill priority className="object-cover brightness-50" />
      </div>

      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 z-1 bg-black/30"></div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-xl px-4 py-8 text-center text-white">
        <h1 className="text-4xl font-bold mb-2">شكراً لحضوركم</h1>
        <h2 className="text-2xl font-semibold mb-6">&quot;دورة إدارة المشاريع الاحترافية بإستخدام الذكاء الاصطناعي&quot;</h2>
        <p className="text-xl mb-8">قم بملء بياناتك لتحصل على شهادتك</p>

        <form onSubmit={handleUserSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
            <Input
  type="text"
  value={fullName}
  onChange={handleNameInput}
  onInput={(e) => {
    // Prevent non-English characters
    e.currentTarget.value = e.currentTarget.value
      .replace(/[^A-Za-z\s-]/g, '');
  }}
  className="w-full bg-white/10 backdrop-blur-sm border-0 text-white placeholder-white/70 h-12 pl-12"
  placeholder="الاسم في الشهادة (باللغة الإنجليزية فقط)"
  required
  dir="rtl"
/>
              <div className="absolute inset-y-0 left-4 flex items-center">
                <span className="text-white">📝</span>
              </div>
            </div>

            <div className="relative">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border-0 text-white placeholder-white/70 h-12 pl-12"
                placeholder="البريد الإلكتروني"
                required
                dir="rtl"
              />
              <div className="absolute inset-y-0 left-4 flex items-center">
                <span className="text-white">📧</span>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={!fullName || !email || loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 h-14 rounded-md disabled:bg-gray-400 transition-colors text-lg"
          >
            {loading ? "جاري التحميل..." : "تحميل الشهادة"}
          </Button>

          {success && (
            <div className="mt-4 text-green-400 flex items-center justify-center">
              <span>✓</span>
              <span className="ml-2">Your submission was successful</span>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
