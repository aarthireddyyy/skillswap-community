import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Search, Repeat, Users, BookOpen, Star, ChevronLeft, ChevronRight, Palette, Code, Globe, Music, ChefHat, Dumbbell, Brush, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SearchBar } from '@/components/common/SearchBar';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { categoryStats, platformStats, mockUsers, mockReviews } from '@/lib/mockData';
import { useRef, useState, useEffect } from 'react';
import { SkillCategory } from '@/types';

const categoryIcons: Record<SkillCategory, React.ElementType> = {
  Design: Palette,
  Code: Code,
  Languages: Globe,
  Music: Music,
  Cooking: ChefHat,
  Fitness: Dumbbell,
  Arts: Brush,
  Business: Briefcase,
};

const categoryGradients: Record<SkillCategory, string> = {
  Design: 'from-blue-500 to-cyan-500',
  Code: 'from-purple-500 to-pink-500',
  Languages: 'from-green-500 to-emerald-500',
  Music: 'from-amber-500 to-orange-500',
  Cooking: 'from-red-500 to-rose-500',
  Fitness: 'from-sky-500 to-blue-500',
  Arts: 'from-pink-500 to-rose-500',
  Business: 'from-slate-500 to-gray-500',
};

function HeroSection() {
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center mesh-gradient overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/20 blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-secondary/20 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container relative z-10 py-20 text-center">
        <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
          🎉 Join 500+ skill swappers today!
        </Badge>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          <span className="gradient-text">Exchange Skills,</span>
          <br />
          <span className="text-foreground">Build Community</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Learn new skills by teaching what you know — no money required.
          Connect with passionate people and grow together.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button variant="hero" size="xl" asChild>
            <Link to="/register">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button variant="outline" size="xl" asChild>
            <a href="#how-it-works">How It Works</a>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <SearchBar
            placeholder="What do you want to learn? (e.g., Guitar, Python, Spanish)"
            onSearch={handleSearch}
            size="lg"
          />
        </div>

        {/* Quick Categories */}
        <div className="flex flex-wrap justify-center gap-2">
          {['Design', 'Code', 'Languages', 'Music'].map(category => (
            <Button
              key={category}
              variant="outline"
              size="sm"
              onClick={() => navigate(`/search?category=${category}`)}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/search')}
            className="rounded-full"
          >
            More...
          </Button>
        </div>
      </div>
    </section>
  );
}

function CategoriesCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', updateScrollButtons);
      return () => ref.removeEventListener('scroll', updateScrollButtons);
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="py-16 bg-card">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Popular Categories</h2>
            <p className="text-muted-foreground mt-2">Explore skills by category</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categoryStats.map(({ name, count }) => {
            const Icon = categoryIcons[name as SkillCategory];
            const gradient = categoryGradients[name as SkillCategory];

            return (
              <Link
                key={name}
                to={`/search?category=${name}`}
                className="flex-shrink-0 w-48"
              >
                <Card className="card-hover overflow-hidden group">
                  <CardContent className="p-6">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg">{name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {count * 15}+ people teaching
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: 'List Your Skills',
      description: 'Add the skills you can teach. Share your expertise with the community.',
      icon: BookOpen,
    },
    {
      number: 2,
      title: 'Find Perfect Matches',
      description: 'Search for people who want to learn what you know and teach what you want.',
      icon: Search,
    },
    {
      number: 3,
      title: 'Swap & Grow Together',
      description: 'Exchange knowledge, build connections, and grow your skillset for free.',
      icon: Repeat,
    },
  ];

  return (
    <section id="how-it-works" className="py-20">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Getting started is easy. In just three simple steps, you'll be exchanging skills with amazing people.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary to-transparent -translate-x-8" />
              )}
              <Card className="card-hover h-full">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-6">
                    <step.icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  const stats = [
    { value: `${platformStats.activeMembers}+`, label: 'Active Members', icon: Users },
    { value: `${platformStats.skillsShared}+`, label: 'Skills Shared', icon: BookOpen },
    { value: `${platformStats.averageRating}★`, label: 'Average Rating', icon: Star },
  ];

  const testimonials = mockReviews.slice(0, 3).map((review, index) => {
    const reviewer = mockUsers.find(u => u.id === review.reviewerId);
    return {
      ...review,
      reviewer,
    };
  });

  return (
    <section id="testimonials" className="py-20 bg-muted/30">
      <div className="container">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 md:gap-8 mb-16">
          {stats.map(stat => (
            <Card key={stat.label} className="card-hover">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <p className="text-2xl md:text-3xl font-bold gradient-text">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Testimonials */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4">What Our Community Says</h2>
          <p className="text-muted-foreground">Real stories from real skill swappers</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map(testimonial => (
            <Card key={testimonial.id} className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 text-warning mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">"{testimonial.comment}"</p>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={testimonial.reviewer?.avatar} />
                    <AvatarFallback className="gradient-bg text-primary-foreground text-xs">
                      {testimonial.reviewer?.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{testimonial.reviewer?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.reviewer?.location.city}, {testimonial.reviewer?.location.country}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20">
      <div className="container">
        <Card className="overflow-hidden">
          <div className="gradient-bg p-8 md:p-12 text-center text-primary-foreground">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Swapping?</h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
              Join thousands of learners and teachers. Your next skill is just one swap away.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="heroOutline" size="xl" asChild>
                <Link to="/register">
                  Create Free Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <CategoriesCarousel />
        <HowItWorks />
        <TrustSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
