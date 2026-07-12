import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { 
  Sun, Moon, ArrowRight, BookOpen, Users, Target, 
  Award, CheckCircle, Sparkles, GraduationCap, Globe
} from 'lucide-react';
import { useTheme } from './ThemeContext'; // 1. Import Context

const Home = () => {
  // 2. Use the global theme state instead of local state
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Users className="text-violet-500" size={24} />,
      title: "Collaborative Social Feed",
      description: "Connect with peers, ask questions, and share your 'aha!' moments in a dedicated academic timeline."
    },
    {
      icon: <BookOpen className="text-cyan-500" size={24} />,
      title: "Resource Sharing",
      description: "Upload notes, flashcards, and study guides. Build your repository while helping others succeed."
    },
    {
      icon: <Target className="text-emerald-500" size={24} />,
      title: "Weekly Goal Tracking",
      description: "Set personalized study targets and watch your progress ring close as you complete tasks."
    },
    {
      icon: <Award className="text-amber-500" size={24} />,
      title: "Gamified Achievements",
      description: "Earn XP, maintain study streaks, and unlock exclusive badges like 'Top Contributor' and 'Night Owl'."
    }
  ];

  return (
    <>
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#050505] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-500 flex flex-col overflow-x-hidden selection:bg-indigo-500/30 relative">
        
        {/* PREMIUM AMBIENT GLOWS */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,rgba(0,0,0,0)_70%)] blur-[100px] pointer-events-none z-0"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.1)_0%,rgba(0,0,0,0)_70%)] blur-[100px] pointer-events-none z-0"></div>

        {/* FLOATING DARK MODE BUTTON */}
        <button
          onClick={toggleDarkMode} // 3. Use toggle function
          className="fixed bottom-8 right-8 z-100 p-3 rounded-full bg-white/80 dark:bg-white/10 text-indigo-500 dark:text-amber-300 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-2xl hover:rotate-12  active:scale-95 transition-transform duration-500"
          aria-label="Toggle Dark Mode"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* 1. GLASS NAVBAR (Fully Visible Wrapping on Mobile) */}
        <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/90 dark:bg-[#050505]/90 backdrop-blur-2xl border-b border-black/5 dark:border-white/5 py-3' : 'bg-transparent border-transparent py-3 md:py-5'}`}>
          <div className="max-w-7xl mx-auto px-3 md:px-6 flex flex-wrap items-center justify-between gap-y-3">
            
            {/* Logo (Top Left on Mobile) */}
            <div className="flex items-center gap-2 md:gap-3 order-1 shrink-0">
              <div className="bg-linear-to-tr from-indigo-600 to-cyan-500 p-1.5 md:p-2 rounded-xl shadow-lg shadow-indigo-500/20">
                <GraduationCap className="text-black dark:text-white w-4 h-4 md:w-5 md:h-5" />
              </div>
              <span className="text-lg md:text-2xl font-bold tracking-tight text-black dark:text-white">StudyTrail</span>
            </div>
            
            {/* Action Buttons (Top Right on Mobile) */}
            <div className="flex items-center gap-3 md:gap-5 order-2 md:order-3 shrink-0">
              <Link to="/Log" className="text-slate-500 dark:text-slate-300 text-xs md:text-sm font-medium hover:text-slate-900 dark:hover:text-white transition-colors">
                Log In
              </Link>
              <Link 
                to="/log" 
                state={{ mode: 'register' }} 
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 md:px-5 md:py-2.5 rounded-full text-xs md:text-sm font-semibold hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-1 md:gap-2"
              >
                Get Started <ArrowRight size={12} className="md:w-4 md:h-4" />
              </Link>
            </div>

            {/* Links (Drops to Bottom Row on Mobile, Centers on Desktop) */}
            <div className="flex w-full md:w-auto items-center justify-center gap-4 md:gap-8 order-3 md:order-2 text-xs md:text-sm font-medium text-slate-500 md:border-transparent pt-2 md:pt-0">
              <a href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">Features</a>
              <Link to="/Workflow" 
                               className="hover:text-slate-900 dark:hover:text-white transition-colors">How It Works</Link>
              <a href="#testimonials" className="hover:text-slate-900 dark:hover:text-white transition-colors">Stories</a>
            </div>

          </div>
        </nav>

        {/* 2. HERO SECTION */}
        {/* Adjusted padding-top to account for the taller responsive navbar */}
        <main className="flex-1 relative z-10 pt-36 md:pt-32">
          <section className="relative pb-24 px-6 lg:pb-32 overflow-hidden">
            <div className="max-w-4xl mx-auto text-center mt-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-8 backdrop-blur-md">
                <Sparkles size={14} /> Empowering students worldwide
              </div>
              <h1 className="text-6xl lg:text-[80px] font-extrabold text-slate-900 dark:text-white tracking-tighter mb-8 leading-[1.05]">
                Your Journey to <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-500 via-purple-500 to-cyan-500">
                  Academic Excellence
                </span>
              </h1>
              <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
                Connect with peers, share resources, and track your study goals in a platform built for the modern student. Stop studying in silos.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link 
                  to="/log" 
                  state={{ mode: 'register' }} 
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-full text-base font-semibold hover:scale-105 transition-all duration-300 shadow-xl shadow-indigo-500/10 flex items-center justify-center gap-2"
                >
                  Create Free Account
                </Link>
                <Link to="/Log" className="bg-white/50 dark:bg-white/5 text-slate-700 dark:text-slate-200 border border-black/10 dark:border-white/10 px-8 py-4 rounded-full text-base font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-300 backdrop-blur-md flex items-center justify-center gap-2">
                  <Globe size={20} /> Explore Community
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="mt-16 flex flex-col items-center gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <img 
                      key={i} 
                      className="w-10 h-10 rounded-full border-2 border-white dark:border-[#050505] object-cover" 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=User${i}&backgroundColor=e2e8f0`} 
                      alt="User avatar" 
                    />
                  ))}
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Joined by <strong className="text-slate-900 dark:text-white">10,000+</strong> students this semester
                </p>
              </div>
            </div>
          </section>

          {/* 3. DASHBOARD PREVIEW / MOCKUP SECTION */}
          <section className="px-6 pb-32 max-w-6xl mx-auto relative perspective-1000">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-linear-to-tr from-indigo-500/20 to-cyan-500/20 blur-[100px] -z-10 rounded-full"></div>
            
            <div className="rounded-2xl md:rounded-4xl p-px bg-linear-to-b from-black/10 to-transparent dark:from-white/20 dark:to-white/5 shadow-2xl shadow-indigo-500/10 transform-gpu rotate-x-2 hover:rotate-x-0 transition-transform duration-700 relative overflow-hidden">
                <div className="bg-[#FDFDFD] dark:bg-[#0A0A0A] rounded-[23px] md:rounded-[31px] aspect-video sm:aspect-21/9 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-14 border-b border-black/5 dark:border-white/5 flex items-center px-4 gap-2 bg-white/50 dark:bg-black/50 backdrop-blur-md z-20">
                  <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                </div>
                
                <GraduationCap size={64} className="mb-4 opacity-20 mt-10" />
                <p className="font-semibold text-lg max-w-md z-10">
                  "This section displays a beautiful, high-fidelity screenshot of the StudyTrail dashboard."
                </p>
              </div>
            </div>
          </section>

          {/* 4. PREMIUM FEATURES GRID */}
          <section id="features" className="py-32 bg-violet- dark:bg-purple-700 border-y border-black/5 dark:border-white/5 backdrop-blur-3xl">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-20 max-w-2xl mx-auto">
                <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white tracking-tighter mb-6">Everything you need to succeed</h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg font-light">StudyTrail combines the best parts of social networking with powerful educational tools.</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, idx) => (
                  <div key={idx} className="bg-white dark:bg-[#0A0A0A] p-8 rounded-3xl border border-black/5 dark:border-white/5 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 group relative overflow-hidden">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-8 border border-black/5 dark:border-white/5 group-hover:scale-110 transition-transform duration-500">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">{feature.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm font-light">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 5. GLOWING CTA BOTTOM */}
          <section className="py-32 px-6 relative overflow-hidden">
            <div className="max-w-5xl mx-auto rounded-[40px] p-12 lg:p-20 text-center relative overflow-hidden shadow-2xl border border-white/10 group">
              {/* Animated Gradient Background */}
              <div className="absolute inset-0 bg-linear-to-br from-indigo-600 via-purple-600 to-cyan-600 group-hover:scale-105 transition-transform duration-1000 -z-10"></div>
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-white/20 rounded-full blur-[80px] -z-10"></div>
              
              <h2 className="text-4xl lg:text-6xl font-bold text-white tracking-tighter mb-6 relative z-10">Ready to boost your grades?</h2>
              <p className="text-indigo-100 text-lg md:text-xl mb-12 max-w-2xl mx-auto relative z-10 font-light">
                Join thousands of students who are already learning faster, together. It takes less than 60 seconds to sign up.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
                <button className="bg-white text-indigo-900 px-10 py-5 rounded-full text-base font-bold hover:scale-105 active:scale-95 transition-all shadow-xl">
                  Get Started for Free
                </button>
              </div>
              
              <div className="mt-10 flex items-center justify-center gap-8 text-white/80 text-sm font-medium relative z-10">
                <span className="flex items-center gap-2"><CheckCircle size={18} /> No credit card required</span>
                <span className="flex items-center gap-2"><CheckCircle size={18} /> Cancel anytime</span>
              </div>
            </div>
          </section>

        </main>

        {/* 6. PREMIUM FOOTER */}
        <footer className="bg-transparent border-t border-black/5 dark:border-white/5 py-16 relative z-10">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-linear-to-tr from-indigo-600 to-cyan-500 p-2 rounded-lg">
                  <GraduationCap className="text-black dark:text-white " size={20} />
                </div>
                <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">StudyTrail</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm leading-relaxed font-light">
                Empowering students worldwide by combining community-driven learning with modern productivity tools.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-6">Platform</h4>
              <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Leaderboard</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Resources</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-black/5 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              &copy; 2026 StudyTrail. All rights reserved.
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-all">X</div>
              <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-all">in</div>
              <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-all">IG</div>
            </div>
          </div>
        </footer>

      </div>
    </div>
    </>
  );
};

export default Home;