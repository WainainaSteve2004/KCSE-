import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Target, Heart } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="pt-20 pb-32">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl font-extrabold text-zinc-900 dark:text-white mb-6">About <span className="text-indigo-600">Examina AI</span></h1>
            <p className="text-xl text-zinc-500 dark:text-zinc-400 leading-relaxed">
              We are on a mission to democratize quality education through cutting-edge artificial intelligence.
            </p>
          </motion.div>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-12 text-zinc-600 dark:text-zinc-400">
            <section className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">What is Examina AI?</h2>
              <p>
                Examina AI is an advanced educational assessment platform designed to provide students with the same high-quality feedback they would receive from expert examiners, instantly. By leveraging sophisticated large language models and computer vision, we can mark everything from complex mathematical proofs to scientific laboratory setups.
              </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'Our Purpose', desc: 'To bridge the gap between assessment and learning by providing immediate, actionable insights.', icon: Target },
                { title: 'Our Vision', desc: 'A world where every student has access to personalised, AI-driven academic support.', icon: ShieldCheck },
                { title: 'Our Values', desc: 'Excellence, Accessibility, and Integrity in everything we build.', icon: Heart },
              ].map((item, i) => (
                <div key={i} className="text-center p-6 bg-zinc-50 dark:bg-zinc-950 rounded-3xl border border-zinc-100 dark:border-zinc-900">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-zinc-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-sm">{item.desc}</p>
                </div>
              ))}
            </div>

            <section>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">The Benefits</h2>
              <ul className="space-y-4 list-none p-0">
                {[
                  'Instant marking reduces learning lag and improves retention.',
                  'Detailed explanations help students understand their mistakes, not just see their scores.',
                  'Teachers save thousands of hours, allowing them to focus on personalized teaching.',
                  'Accessible from anywhere, leveling the playing field for students in remote areas.'
                ].map((benefit, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <div className="mt-1.5 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-3 h-3" />
                    </div>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
