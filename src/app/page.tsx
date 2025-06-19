"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, Users, Calendar, BarChart3, Database, TestTube, LogIn, UserPlus, ArrowRight, Sparkles, Zap, Shield } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/50 to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Navigation */}
      <nav className="nav-professional sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <span className="text-2xl font-bold gradient-text">TrackX</span>
                <div className="text-xs text-medium-contrast -mt-1 font-medium">Professional Task Management</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {session ? (
                <Button asChild className="btn-professional">
                  <Link href="/dashboard">
                    Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" asChild className="hidden sm:flex text-high-contrast font-medium hover:bg-purple-50 dark:hover:bg-slate-800">
                    <Link href="/auth/signin">Sign In</Link>
                  </Button>
                  <Button asChild className="btn-professional">
                    <Link href="/auth/signup">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.08),transparent_60%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_30%,rgba(139,92,246,0.03)_50%,transparent_70%)]"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <div className="inline-flex items-center px-6 py-3 rounded-full professional-card mb-8 shadow-lg">
              <Zap className="w-4 h-4 text-purple-600 mr-2" />
              <span className="text-sm font-bold text-high-contrast">
                Next-Generation Task Management
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="text-high-contrast">Transform Your</span>
              <br />
              <span className="gradient-text">Team's Workflow</span>
            </h1>

            <p className="text-lg md:text-xl text-medium-contrast mb-10 max-w-3xl mx-auto leading-relaxed font-medium">
              Experience the future of project management with TrackX. Built for modern teams who demand
              <span className="text-purple-600 dark:text-purple-400 font-bold"> exceptional speed</span>,
              <span className="text-purple-600 dark:text-purple-400 font-bold"> ultimate flexibility</span>, and
              <span className="text-purple-600 dark:text-purple-400 font-bold"> seamless collaboration</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              {session ? (
                <Button size="lg" className="btn-professional text-base px-8 py-4" asChild>
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" className="btn-professional text-base px-8 py-4" asChild>
                    <Link href="/auth/signup">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Start Free Trial
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" className="text-base px-8 py-4 professional-card border-2 border-purple-200 dark:border-purple-800 text-high-contrast font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20" asChild>
                    <Link href="/auth/signin">
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </Link>
                  </Button>
                </>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-8 text-medium-contrast">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm font-medium">No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                  <Zap className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                </div>
                <span className="text-sm font-medium">Setup in 2 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </div>
                <span className="text-sm font-medium">Enterprise-grade security</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-50/30 to-transparent dark:via-purple-900/20"></div>
        <div className="container mx-auto px-6 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full professional-card mb-6 shadow-lg">
              <Sparkles className="w-4 h-4 text-purple-600 mr-2" />
              <span className="text-sm font-bold text-high-contrast">Powerful Features</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-high-contrast mb-4">
              Everything you need to <span className="gradient-text">succeed</span>
            </h2>
            <p className="text-lg text-medium-contrast max-w-3xl mx-auto leading-relaxed font-medium">
              Powerful features designed to streamline your workflow and boost team productivity
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="professional-card group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mb-8 shadow-xl group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-high-contrast">Smart Task Management</h3>
              <p className="text-medium-contrast leading-relaxed mb-6 font-medium">
                Create, assign, and track tasks with AI-powered insights and rich collaboration features.
              </p>
              <div className="flex items-center text-sm text-purple-600 dark:text-purple-400 font-bold hover:text-purple-700 dark:hover:text-purple-300 transition-colors cursor-pointer">
                Learn more <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </div>

            <div className="modern-card group">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Team Collaboration</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Real-time collaboration with advanced permissions, mentions, and seamless communication.
              </p>
              <div className="flex items-center text-sm text-purple-600 dark:text-purple-400 font-medium">
                Learn more <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </div>

            <div className="modern-card group">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Agile Sprint Planning</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Plan sprints, manage backlogs, and track velocity with built-in agile methodologies.
              </p>
              <div className="flex items-center text-sm text-purple-600 dark:text-purple-400 font-medium">
                Learn more <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </div>

            <div className="modern-card group">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Advanced Analytics</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Get deep insights with burndown charts, velocity tracking, and custom reporting dashboards.
              </p>
              <div className="flex items-center text-sm text-purple-600 dark:text-purple-400 font-medium">
                Learn more <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* System Status Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium mb-4">
                <CheckCircle className="w-4 h-4 mr-2" />
                Platform Status
              </div>
              <h2 className="text-3xl font-bold text-high-contrast mb-4">
                System Health
              </h2>
              <p className="text-lg text-medium-contrast leading-relaxed">
                Real-time monitoring of all TrackX services and infrastructure
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-3xl blur-xl opacity-20"></div>
              <div className="relative professional-card border-2 border-green-100 dark:border-green-900/50">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-high-contrast">System Status</h3>
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-sm font-semibold">All Systems Operational</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <span className="text-sm font-medium text-high-contrast">Database</span>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">Connected</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <span className="text-sm font-medium text-high-contrast">Authentication</span>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <span className="text-sm font-medium text-high-contrast">API Services</span>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">Running</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-green-200 dark:border-green-800">
                  <div className="flex justify-center">
                    <Button variant="outline" size="sm" className="professional-card border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20" onClick={() => window.open('/api/health', '_blank')}>
                      <Database className="h-4 w-4 mr-2" />
                      Health Check
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="bg-gradient-to-r from-slate-900 via-purple-900/20 to-slate-900 dark:from-slate-950 dark:via-purple-950/30 dark:to-slate-950 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <span className="text-3xl font-bold gradient-text">TrackX</span>
                <div className="text-sm text-slate-400 -mt-1">Professional Task Management</div>
              </div>
            </div>

            <div className="text-center md:text-right">
              <p className="text-slate-300 mb-2 font-medium">
                Built for modern teams who demand excellence
              </p>
              <p className="text-sm text-slate-500">
                © 2024 TrackX. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
