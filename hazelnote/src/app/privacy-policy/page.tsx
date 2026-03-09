export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-[#10B981] border-b-4 border-[#10B981] pb-4 mb-8">Privacy Policy</h1>
        <p className="text-gray-500 italic mb-8">Last Updated: March 2, 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-[#059669] mb-4">1. Introduction</h2>
          <p className="text-gray-700 mb-4">
            Welcome to HazelNote. This Privacy Policy explains how free-ed (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses, discloses, and protects your personal information when you use HazelNote (&quot;the Service&quot;).
          </p>
          <p className="text-gray-700">By using the Service, you consent to the data practices described in this policy.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-[#059669] mb-4">2. Information We Collect</h2>
          
          <h3 className="text-lg font-semibold text-[#047857] mb-2">2.1 Information You Provide</h3>
          <p className="text-gray-700 mb-4">We collect information you voluntarily provide when using the Service:</p>
          <table className="w-full border-collapse mb-6">
            <thead>
              <tr className="bg-[#10B981] text-white">
                <th className="p-3 text-left border">Category</th>
                <th className="p-3 text-left border">Examples</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 border">Account Information</td>
                <td className="p-3 border">Name, email address, password</td>
              </tr>
              <tr>
                <td className="p-3 border">Study Content</td>
                <td className="p-3 border">PDFs, text, voice recordings, YouTube URLs</td>
              </tr>
              <tr>
                <td className="p-3 border">Generated Content</td>
                <td className="p-3 border">Notes, flashcards, quizzes, study sets</td>
              </tr>
              <tr>
                <td className="p-3 border">Payment Information</td>
                <td className="p-3 border">Billing details (processed by Stripe)</td>
              </tr>
              <tr>
                <td className="p-3 border">Communications</td>
                <td className="p-3 border">Support inquiries, feedback</td>
              </tr>
            </tbody>
          </table>

          <h3 className="text-lg font-semibold text-[#047857] mb-2">2.2 Automatically Collected Information</h3>
          <p className="text-gray-700 mb-4">We automatically collect certain information when you use the Service:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Usage Data:</strong> Pages viewed, features used, time spent</li>
            <li><strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
            <li><strong>Log Data:</strong> IP address, access times, error logs</li>
            <li><strong>Cookies:</strong> Authentication tokens, preferences</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-[#059669] mb-4">3. How We Use Your Information</h2>
          <p className="text-gray-700 mb-4">We use collected information for the following purposes:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Process uploaded content to generate study materials</li>
            <li>Create and manage your account</li>
            <li>Store and organize your study sets</li>
            <li>Enable features like flashcards, quizzes, and podcasts</li>
            <li>Analyze usage patterns to improve features</li>
            <li>Train and improve AI models</li>
            <li>Send service-related notifications</li>
            <li>Prevent fraud and abuse</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-[#059669] mb-4">4. AI Processing and Content</h2>
          <p className="text-gray-700 mb-4">
            We use Google&apos;s Gemini AI to process your content. Your uploaded content may be used to generate study materials and improve our AI processing capabilities.
          </p>
          <p className="text-gray-700"><strong>Note:</strong> We anonymize content before using it for AI training. Personal information is removed.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-[#059669] mb-4">5. Data Storage and Security</h2>
          <p className="text-gray-700 mb-4">Your data is stored on:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Firebase servers (Google Cloud Platform)</li>
            <li>Our hosting infrastructure</li>
            <li>Third-party service provider servers</li>
          </ul>
          <p className="text-gray-700 mt-4">We implement security measures including:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Encryption in transit (HTTPS/TLS)</li>
            <li>Encryption at rest for sensitive data</li>
            <li>Secure authentication (password hashing)</li>
            <li>Regular security audits</li>
            <li>Access controls and monitoring</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-[#059669] mb-4">6. Your Rights and Choices</h2>
          <p className="text-gray-700 mb-4">You can:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Access and update your information through account settings</li>
            <li>Request deletion of specific study sets or your entire account</li>
            <li>Request an export of your data in JSON or PDF format</li>
            <li>Opt out of promotional emails</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-[#059669] mb-4">7. Contact Us</h2>
          <p className="text-gray-700">
            If you have questions about this Privacy Policy, please contact us at:<br />
            <strong>Email:</strong> hazelnote@free-ed.site
          </p>
        </section>
      </div>
    </div>
  );
}
