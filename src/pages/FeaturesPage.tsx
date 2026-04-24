import React from 'react';
import { motion } from 'motion/react';
import { 
  BrainCircuit, 
  Calculator, 
  FlaskConical, 
  CheckCircle2, 
  Clock, 
  BarChart3,
  Search,
  Zap,
  Globe
} from 'lucide-react';

const FeaturesPage = () => {
  const features = [
    {
      title: "AI Theory Marking",
      desc: "Our AI understands context, nuance, and meaning. It marks theory answers against official marking schemes with over 95% correlation to human examiners.",
      icon: BrainCircuit,
      color: "text-indigo-600",
      bg: "bg-indigo-50 dark:bg-indigo-900/20"
    },
    {
      title: "Mathematics Step-Solving",
      desc: "Don't just get a right or wrong answer. Our system marks your working, awarding partial marks for correct steps using logical progression analysis.",
      icon: Calculator,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-900/20"
    },
    {
      title: "Practical Image Analysis",
      desc: "Upload photos of your science practical setups. Our AI identifies apparatus, chemicals, and arrangements to verify experimental accuracy.",
      icon: FlaskConical,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-900/20"
    },
    {
      title: "Multi-System Support",
      desc: "Whether you are under the CBE, KJSEA, or our specialized Examina Secondary system, we have tailored papers and assessment models for you.",
      icon: Globe,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "Performance Analytics",
      desc: "Visualise your progress over time. Identify your strongest subjects and focus your energy where it's needed most with deep data insights.",
      icon: BarChart3,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-900/20"
    },
    {
      title: "Instant Verification",
      desc: "Results are generated in seconds, allowing students to learn from their mistakes while the context of the question is still fresh in their minds.",
      icon: Zap,
      color: "text-yellow-600",
      bg: "bg-yellow-50 dark:bg-yellow-900/20"
    }
  ];

  return (
    <div className="pt-20 pb-32">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-extrabold text-zinc-900 dark:text-white mb-6"
          >
            Powerful Features for <span className="text-indigo-600">Modern Learning</span>
          </motion.h1>
          <p className="text-xl text-zinc-500 dark:text-zinc-400">
            Examina AI combines state-of-the-art neural networks with pedagogical expertise to deliver a premium testing environment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {features.map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group"
            >
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-2xl transition-all duration-500 h-full relative overflow-hidden">
                <div className={`${feature.bg} ${feature.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4 group-hover:text-indigo-600 transition-colors">{feature.title}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">{feature.desc}</p>
                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity">
                  <feature.icon className="w-24 h-24" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;
