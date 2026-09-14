import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Video, 
  PenTool, 
  Share2, 
  Megaphone, 
  MonitorSmartphone,
  Building,
  User,
  Lightbulb,
  GraduationCap,
  Sparkles,
  Target,
  Zap,
  TrendingUp,
  Menu
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-[#E8E0D0] font-sans">
      {/* NAVIGATION */}
      <nav className="sticky top-0 z-50 bg-[#080808]/90 backdrop-blur-md border-b border-[#222]">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Replace with actual logo later */}
            <div className="w-8 h-8 bg-[#C9A84C] rounded-sm flex items-center justify-center font-bold text-black font-serif">
              RE
            </div>
            <span className="font-serif text-xl font-bold tracking-wide">ROYAL EDIT</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#home" className="hover:text-[#C9A84C] transition-colors">HOME</a>
            <a href="#about" className="hover:text-[#C9A84C] transition-colors">ABOUT</a>
            <a href="#services" className="hover:text-[#C9A84C] transition-colors">SERVICES</a>
            <a href="#work" className="hover:text-[#C9A84C] transition-colors">OUR WORK</a>
            <a href="#contact" className="hover:text-[#C9A84C] transition-colors">CONTACT</a>
            <Button className="bg-[#C9A84C] text-black hover:bg-[#C9A84C]/90 font-bold rounded-none">
              WORK WITH US
            </Button>
          </div>

          <Button variant="ghost" size="icon" className="md:hidden text-[#C9A84C]">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </nav>

      {/* 1. HERO SECTION */}
      <section id="home" className="relative pt-32 pb-40 px-6 flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Abstract background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#C9A84C]/5 rounded-full blur-3xl -z-10" />
        
        <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6 max-w-4xl leading-tight">
          We Build Brands That <span className="text-[#C9A84C]">Get Seen.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
          Creative media, branding and digital solutions designed to help businesses, creators and organizations stand out.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" className="bg-[#C9A84C] text-black hover:bg-[#C9A84C]/90 font-bold px-8 rounded-none">
            Work With Us
          </Button>
          <Button size="lg" variant="outline" className="border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C]/10 rounded-none">
            View Our Work
          </Button>
        </div>
      </section>

      {/* 2. ABOUT ROYAL EDIT MEDIA HOUSE */}
      <section id="about" className="py-24 px-6 bg-[#111]">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-3xl md:text-5xl font-bold mb-8">More Than Media. We Build Presence.</h2>
          <p className="text-lg text-gray-400 leading-relaxed">
            Royal Edit Media House is a premier creative agency. We solve the problem of digital invisibility by equipping businesses, creators, and organizations with high-impact visuals and strategic digital presence. Our vision is to ensure that every brand with something to say is heard and remembered.
          </p>
        </div>
      </section>

      {/* 3. OUR SERVICES */}
      <section id="services" className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl font-bold mb-4">Our Services</h2>
            <div className="w-16 h-1 bg-[#C9A84C] mx-auto" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Video size={32} />, title: "Video Editing", items: ["Social media videos", "Promotional videos", "Event/documentary edits"] },
              { icon: <PenTool size={32} />, title: "Graphic Design", items: ["Flyers", "Posters", "Brand visuals", "Social media designs"] },
              { icon: <Share2 size={32} />, title: "Social Media Management", items: ["Content planning", "Page management", "Growth strategy"] },
              { icon: <Megaphone size={32} />, title: "Advertising & Promotion", items: ["Business advertising", "Campaign content", "Promotional strategies"] },
            ].map((service, i) => (
              <Card key={i} className="bg-[#111] border-[#222] hover:border-[#C9A84C] transition-colors rounded-none">
                <CardContent className="p-8">
                  <div className="text-[#C9A84C] mb-6">{service.icon}</div>
                  <h3 className="font-bold text-xl mb-4 text-[#E8E0D0]">{service.title}</h3>
                  <ul className="space-y-2 text-gray-400 text-sm mb-8">
                    {service.items.map((item, j) => <li key={j}>• {item}</li>)}
                  </ul>
                  <Button variant="link" className="text-[#C9A84C] p-0 h-auto font-bold group">
                    Get a Service <span className="group-hover:translate-x-1 transition-transform ml-2">→</span>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4. WHO WE WORK WITH */}
      <section className="py-24 px-6 bg-[#C9A84C] text-black">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl font-bold mb-4">Built For People With Something To Say.</h2>
            <p className="text-lg font-medium opacity-80">We partner with ambitious visionaries.</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            {[
              { icon: <Building />, label: "Businesses" },
              { icon: <Lightbulb />, label: "Entrepreneurs" },
              { icon: <Sparkles />, label: "Creators" },
              { icon: <MonitorSmartphone />, label: "Organizations" },
              { icon: <User />, label: "Personal Brands" },
              { icon: <GraduationCap />, label: "Students/Campus" },
            ].map((target, i) => (
              <div key={i} className="flex flex-col items-center gap-3 p-6 bg-black/5 hover:bg-black/10 transition-colors w-40 text-center">
                <div className="p-4 bg-black text-[#C9A84C] rounded-full">{target.icon}</div>
                <span className="font-bold text-sm uppercase tracking-wider">{target.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. WHY ROYAL EDIT? */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl font-bold mb-4">Why Royal Edit?</h2>
            <div className="w-16 h-1 bg-[#C9A84C] mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 max-w-4xl mx-auto">
            {[
              { icon: <Sparkles />, title: "Creative", desc: "We don't just make content; we make it memorable." },
              { icon: <Target />, title: "Strategic", desc: "Every piece of content has a purpose." },
              { icon: <Zap />, title: "Modern", desc: "We use modern creative and digital tools." },
              { icon: <TrendingUp />, title: "Results-Focused", desc: "We create with visibility, engagement and growth in mind." },
            ].map((point, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="p-3 bg-[#111] border border-[#222] text-[#C9A84C] rounded-sm shrink-0">
                  {point.icon}
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-2">{point.title}</h3>
                  <p className="text-gray-400">{point.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. OUR WORK / PORTFOLIO */}
      <section id="work" className="py-24 px-6 bg-[#111]">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="font-serif text-4xl font-bold mb-4">Our Work</h2>
              <div className="w-16 h-1 bg-[#C9A84C]" />
            </div>
            <Button variant="outline" className="border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C]/10 rounded-none">
              View More Work
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((project) => (
              <div key={project} className="group cursor-pointer">
                <div className="aspect-video bg-[#222] relative overflow-hidden mb-4 border border-[#333]">
                  {/* Placeholder for project thumbnail */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[#C9A84C] font-bold">View Project</span>
                  </div>
                </div>
                <h3 className="font-bold text-lg">Campus Brand Campaign {project}</h3>
                <p className="text-[#C9A84C] text-sm font-medium mb-2">Social Media + Graphic Design</p>
                <p className="text-gray-400 text-sm line-clamp-2">An integrated campaign designed to boost visibility across campus networks.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. SIMPLE RESULTS / SOCIAL PROOF */}
      <section className="py-20 px-6 border-y border-[#222]">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-[#222]">
            <div>
              <div className="text-4xl md:text-5xl font-serif font-bold text-[#C9A84C] mb-2">50+</div>
              <div className="text-sm text-gray-400 font-medium uppercase tracking-wider">Projects Completed</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-serif font-bold text-[#C9A84C] mb-2">20+</div>
              <div className="text-sm text-gray-400 font-medium uppercase tracking-wider">Brands Served</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-serif font-bold text-[#C9A84C] mb-2">...</div>
              <div className="text-sm text-gray-400 font-medium uppercase tracking-wider">Content Pieces</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-serif font-bold text-[#C9A84C] mb-2">...</div>
              <div className="text-sm text-gray-400 font-medium uppercase tracking-wider">Platforms Managed</div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. TESTIMONIALS */}
      <section className="py-24 px-6 bg-[#111]">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl font-bold mb-4">Client Feedback</h2>
            <div className="w-16 h-1 bg-[#C9A84C] mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((t) => (
              <Card key={t} className="bg-[#080808] border-[#222] rounded-none">
                <CardContent className="p-8">
                  <div className="text-[#C9A84C] mb-6 text-xl tracking-widest">★★★★★</div>
                  <p className="text-gray-300 italic mb-8 leading-relaxed">
                    "Royal Edit Media House helped us transform the way our brand presents itself online. Highly recommended!"
                  </p>
                  <div>
                    <div className="font-bold text-[#E8E0D0]">Client Name</div>
                    <div className="text-[#C9A84C] text-sm">Business/Organization</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 9. CALL TO ACTION */}
      <section className="py-32 px-6 text-center bg-gradient-to-b from-[#080808] to-[#1a1405]">
        <div className="container mx-auto max-w-3xl">
          <h2 className="font-serif text-5xl md:text-6xl font-bold mb-6">Ready To Build Your Brand?</h2>
          <p className="text-xl text-gray-400 mb-10">Let's create something people will remember.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-[#C9A84C] text-black hover:bg-[#C9A84C]/90 font-bold px-10 rounded-none text-lg h-14">
              Work With Royal Edit
            </Button>
            <Button size="lg" variant="outline" className="border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C]/10 rounded-none text-lg h-14 px-10">
              Chat With Us
            </Button>
          </div>
        </div>
      </section>

      {/* 10. CONTACT / FOOTER */}
      <footer id="contact" className="py-12 px-6 border-t border-[#222] bg-[#080808]">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#C9A84C] rounded-sm flex items-center justify-center font-bold text-black font-serif text-xs">
              RE
            </div>
            <span className="font-serif font-bold tracking-wide">ROYAL EDIT</span>
          </div>
          
          <div className="flex gap-6 text-sm text-gray-400 font-medium">
            <a href="#home" className="hover:text-[#C9A84C]">Home</a>
            <a href="#services" className="hover:text-[#C9A84C]">Services</a>
            <a href="#work" className="hover:text-[#C9A84C]">Work</a>
            <a href="#about" className="hover:text-[#C9A84C]">About</a>
            <a href="#contact" className="hover:text-[#C9A84C]">Contact</a>
          </div>

          <div className="flex gap-4 text-gray-400">
            {/* Replace with actual social links/icons */}
            <a href="#" className="hover:text-[#C9A84C]">IG</a>
            <a href="#" className="hover:text-[#C9A84C]">TT</a>
            <a href="#" className="hover:text-[#C9A84C]">FB</a>
            <a href="#" className="hover:text-[#C9A84C]">WA</a>
          </div>
        </div>
        <div className="container mx-auto mt-12 text-center text-xs text-gray-600">
          © 2026 Royal Edit Media House. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
