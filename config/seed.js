require('dotenv').config();
const mongoose = require('mongoose');
const { User, Celebrity, Post } = require('../models');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB...');

  await Celebrity.deleteMany({});
  await Post.deleteMany({});

  // Create admin user
  const existingAdmin = await User.findOne({ email: 'admin@springcompany.com' });
  if (!existingAdmin) {
    await User.create({
      firstName: 'Springcompany',
      lastName: 'Admin',
      email: 'admin@springcompany.com',
      password: 'Admin@2025!',
      role: 'admin',
      isVerified: true,
    });
    console.log('✅  Admin user created: admin@springcompany.com / Admin@2025!');
  }

  // Seed celebrities
  await Celebrity.insertMany([
    {
      name: 'Aria Sinclair',
      slug: 'aria-sinclair',
      occupation: 'Pop Artist & Performer',
      category: 'Music',
      bio: 'Multi-platinum pop artist with 12 Grammy nominations and worldwide sold-out tours. Known for electrifying stage performances and chart-topping hits.',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80',
      dob: 'March 15, 1990',
      age: 35,
      nationality: 'American',
      yearsActive: '2010–Present',
      baseFee: '$50,000+',
      verified: true,
      rating: 4.9,
      totalBookings: 247,
      featured: true,
      tags: ['pop', 'performer', 'grammy', 'concerts'],
    },
    {
      name: 'Marcus Williams',
      slug: 'marcus-williams',
      occupation: 'Film Actor & Director',
      category: 'Film',
      bio: 'Award-winning actor known for blockbuster franchises and critically acclaimed independent films. Three-time Screen Actors Guild winner.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
      dob: 'June 22, 1985',
      age: 39,
      nationality: 'British',
      yearsActive: '2005–Present',
      baseFee: '$75,000+',
      verified: true,
      rating: 4.8,
      totalBookings: 189,
      featured: true,
      tags: ['actor', 'director', 'hollywood', 'blockbuster'],
    },
    {
      name: 'Sofia Reyes',
      slug: 'sofia-reyes',
      occupation: 'Latin Pop Singer',
      category: 'Music',
      bio: 'Latin pop sensation with over 2 billion streams globally. International chart-topper known for energetic performances and bilingual hits.',
      image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80',
      dob: 'July 4, 1995',
      age: 29,
      nationality: 'Mexican',
      yearsActive: '2015–Present',
      baseFee: '$35,000+',
      verified: true,
      rating: 4.9,
      totalBookings: 312,
      featured: true,
      tags: ['latin', 'pop', 'bilingual', 'streaming'],
    },
    {
      name: 'Jordan Blake',
      slug: 'jordan-blake',
      occupation: 'Professional Athlete',
      category: 'Sports',
      bio: 'NBA champion and Olympic gold medalist. Brand ambassador for 15+ global brands. Inspirational speaker and youth mentor.',
      image: 'https://images.unsplash.com/photo-1534308143481-c55f00be8bd7?w=600&q=80',
      dob: 'September 10, 1992',
      age: 32,
      nationality: 'American',
      yearsActive: '2012–Present',
      baseFee: '$100,000+',
      verified: true,
      rating: 4.7,
      totalBookings: 156,
      featured: false,
      tags: ['nba', 'basketball', 'olympic', 'brand ambassador'],
    },
    {
      name: 'Luna Chase',
      slug: 'luna-chase',
      occupation: 'Fashion Model & Actress',
      category: 'Fashion',
      bio: 'Rising fashion icon featured in Vogue, Elle, and 30+ international campaigns. Known for her versatility and striking presence.',
      image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80',
      dob: 'January 28, 1998',
      age: 27,
      nationality: 'French',
      yearsActive: '2018–Present',
      baseFee: '$25,000+',
      verified: false,
      rating: 4.6,
      totalBookings: 98,
      featured: false,
      tags: ['model', 'fashion', 'vogue', 'actress'],
    },
    {
      name: 'Kevin Stone',
      slug: 'kevin-stone',
      occupation: 'Stand-Up Comedian',
      category: 'Comedy',
      bio: 'Chart-topping comedian with 3 Netflix specials and sold-out world tours. Master of observational humour and crowd engagement.',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80',
      dob: 'April 5, 1983',
      age: 41,
      nationality: 'British',
      yearsActive: '2006–Present',
      baseFee: '$30,000+',
      verified: true,
      rating: 4.8,
      totalBookings: 203,
      featured: false,
      tags: ['comedy', 'netflix', 'stand-up', 'british'],
    },
  ]);

  // Seed trending posts
  await Post.insertMany([
    {
      title: 'Record-Breaking Celebrity Bookings in Q1 2025',
      excerpt: 'Springcompany reports its highest-ever booking numbers as demand for celebrity appearances surges globally.',
      category: 'News',
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80',
      published: true,
      featured: true,
      views: 45200,
    },
    {
      title: 'New VIP Meet & Greet Packages Now Available',
      excerpt: 'Springcompany launches premium meet and greet packages with exclusive VR experience add-ons for 2025.',
      category: 'Announcement',
      image: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&q=80',
      published: true,
      featured: true,
      views: 32100,
    },
    {
      title: 'Bitcoin Payments Now Accepted on Springcompany',
      excerpt: 'We become the first major celebrity booking platform to accept full Bitcoin and Ethereum payments.',
      category: 'Feature',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80',
      published: true,
      featured: false,
      views: 28750,
    },
  ]);

  console.log('✅  Celebrities seeded (6 celebrities)');
  console.log('✅  Posts seeded (3 posts)');
  console.log('\n🌟  Springcompany seed complete!');
  console.log('   Admin: admin@springcompany.com / Admin@2025!');
  console.log('   Demo user: Register on the frontend');
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
