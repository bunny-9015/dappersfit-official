export default function About() {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">About DappersFit</h1>
          <p className="mt-4 text-xl text-gray-500">Your trusted partner in premium luxury timepieces.</p>
        </div>

        <div className="mt-20">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
            
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">Who We Are</h2>
              <p className="mt-4 text-lg text-gray-500">
                DappersFit is a premier destination for watch enthusiasts and collectors. We specialize in sourcing, authenticating, and delivering the world's most sought-after luxury timepieces.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">Our Mission</h2>
              <p className="mt-4 text-lg text-gray-500">
                To provide an unparalleled luxury shopping experience, offering access to rare and premium watches with absolute transparency, authenticity, and exceptional customer service.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">Why Choose DappersFit</h2>
              <ul className="mt-4 space-y-4 text-lg text-gray-500 list-disc pl-5">
                <li><strong>Premium Brands:</strong> Access to Rolex, Patek Philippe, Audemars Piguet, Omega, and more.</li>
                <li><strong>Quality Assurance:</strong> Every timepiece is rigorously inspected and authenticated by experts.</li>
                <li><strong>Customer Support:</strong> Dedicated concierge service to assist you at every step.</li>
                <li><strong>Secure Ecosystem:</strong> Fully insured shipping and secure checkout.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">Future Vision</h2>
              <p className="mt-4 text-lg text-gray-500">
                We are building the future of luxury retail. Our platform is designed to seamlessly scale to offer over 10,000+ curated products while maintaining the personalized touch of a boutique shopping experience.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
