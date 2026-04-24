import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';

const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate sending
    alert('Message sent! (Simulation)');
    setSent(true);
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="pt-20 pb-32">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16">
            <div className="lg:w-1/2">
              <h1 className="text-5xl font-extrabold text-zinc-900 dark:text-white mb-6">Get in <span className="text-indigo-600">Touch</span></h1>
              <p className="text-xl text-zinc-500 dark:text-zinc-400 mb-12">
                Have questions about Examina AI? Our support team is here to help you navigate the future of education.
              </p>

              <div className="space-y-8">
                {[
                  { icon: Mail, label: 'Email Support', value: 'support@examina-ai.com' },
                  { icon: Phone, label: 'Call Us', value: '+254 700 000 000' },
                  { icon: MapPin, label: 'Main Office', value: 'Nairobi, Kenya' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{item.label}</p>
                      <p className="text-lg font-medium text-zinc-900 dark:text-white">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:w-1/2">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-xl"
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Send us a Message</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Full Name</label>
                    <input 
                      type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email Address</label>
                    <input 
                      type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Message</label>
                    <textarea 
                      required rows={4} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    ></textarea>
                  </div>
                  <button className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20">
                    Send Message
                    <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
