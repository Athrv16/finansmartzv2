
"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, User, MessageCircle, Phone, Building, ChevronDown } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    inquiryType: "General",
    message: ""
  });
  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Sending...");
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setStatus("Message sent!");
      setForm({
        name: "",
        email: "",
        phone: "",
        company: "",
        inquiryType: "General",
        message: ""
      });
    } else {
      setStatus("Failed to send. Try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4 overflow-hidden">
      {/* Creative Ribbon Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-2/3 h-60 bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 opacity-40 blur-2xl rounded-full transform -rotate-12 animate-ribbon-move" />
        <div className="absolute bottom-0 right-0 w-2/3 h-60 bg-gradient-to-l from-pink-300 via-blue-300 to-indigo-300 opacity-30 blur-2xl rounded-full transform rotate-6 animate-ribbon-move-delay" />
        <div className="absolute left-1/4 top-1/2 w-1/2 h-32 bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-200 opacity-30 blur-2xl rounded-full transform -rotate-6 animate-ribbon-move" />
      </div>
      <style>{`
        @keyframes ribbon-move {
          0% { transform: translateY(0) rotate(-12deg); }
          50% { transform: translateY(20px) rotate(-8deg); }
          100% { transform: translateY(0) rotate(-12deg); }
        }
        .animate-ribbon-move {
          animation: ribbon-move 6s ease-in-out infinite;
        }
        .animate-ribbon-move-delay {
          animation: ribbon-move 8s ease-in-out infinite;
        }
      `}</style>
      <div className="w-full flex flex-col items-center justify-center relative z-10">
        <h1 className="text-5xl font-extrabold text-blue-700 dark:text-blue-200 mb-4 text-center tracking-tight">Contact Us</h1>
        <p className="text-lg text-slate-700 dark:text-slate-200 mb-25 text-center max-w-2xl">We'd love to hear from you! Fill out the form and we'll get back to you soon.</p>
        <form onSubmit={handleSubmit} className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6 px-0 md:px-8">
          {/* Name */}
          <div className="relative col-span-1">
            <User className="absolute left-3 top-3 text-blue-400" size={20} />
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Your Name"
              className="w-full pl-10 pr-3 py-3 rounded-lg border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white transition-all"
            />
          </div>
          {/* Email */}
          <div className="relative col-span-1">
            <Mail className="absolute left-3 top-3 text-blue-400" size={20} />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="Your Email"
              className="w-full pl-10 pr-3 py-3 rounded-lg border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white transition-all"
            />
          </div>
          {/* Phone */}
          <div className="relative col-span-1">
            <Phone className="absolute left-3 top-3 text-blue-400" size={20} />
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              className="w-full pl-10 pr-3 py-3 rounded-lg border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white transition-all"
            />
          </div>
          {/* Inquiry Type */}
          <div className="relative col-span-1">
            <select
              name="inquiryType"
              value={form.inquiryType}
              onChange={handleChange}
              className="w-full pl-4 pr-3 py-3 rounded-lg border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white transition-all appearance-none"
            >
              <option value="General">General Inquiry</option>
              <option value="Support">Support</option>
              <option value="Feedback">Feedback</option>
              <option value="Business">Business</option>
            </select>
            <ChevronDown className="absolute right-3 top-3 text-blue-400 pointer-events-none" size={20} />
          </div>
          {/* Message */}
          <div className="relative col-span-1 md:col-span-2">
            <MessageCircle className="absolute left-3 top-3 text-blue-400" size={20} />
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              required
              placeholder="Your Message"
              className="w-full pl-10 pr-3 py-3 rounded-lg border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white transition-all resize-none"
              rows={5}
            />
          </div>
          {/* Submit Button */}
          <div className="col-span-1 md:col-span-2">
            <Button type="submit" className="w-full bg-blue-600 text-white text-lg py-3 shadow-lg hover:bg-blue-700 transition-all">Send Message</Button>
            {status && <p className="text-center mt-2 text-blue-600 dark:text-blue-200 animate-fade-in">{status}</p>}
          </div>
        </form>
      </div>
    </div>
  );
}
