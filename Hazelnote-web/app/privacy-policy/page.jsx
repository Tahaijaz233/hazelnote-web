export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto p-8 sm:p-12 font-sans text-gray-800 leading-relaxed rounded-3xl shadow-sm border border-gray-100">
        
        <div className="mb-8">
            <a href="/" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition">← Back to Home</a>
        </div>

        <h1 className="text-4xl font-extrabold text-[#10B981] border-b-4 border-[#10B981] pb-4 mb-4">Privacy Policy</h1>
        <p className="italic text-gray-500 mb-10">Last Updated: March 2, 2026</p>

        <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#059669] mt-8 mb-4">1. Introduction</h2>
            <p className="mb-4">Welcome to HazelNote. This Privacy Policy explains how free-ed ("we," "us," or "our") collects, uses, discloses, and protects your personal information when you use HazelNote ("the Service").</p>
            <p className="mb-4">By using the Service, you consent to the data practices described in this policy.</p>
        </div>

        <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#059669] mt-8 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-lg font-bold text-[#047857] mt-6 mb-3">2.1 Information You Provide</h3>
            <p className="mb-4">We collect information you voluntarily provide when using the Service:</p>
            <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                        <tr className="bg-[#10B981] text-white">
                            <th className="border border-gray-300 p-3 text-left">Category</th>
                            <th className="border border-gray-300 p-3 text-left">Examples</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border border-gray-300 p-3 font-semibold">Account Information</td>
                            <td className="border border-gray-300 p-3">Name, email address, password</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 p-3 font-semibold">Study Content</td>
                            <td className="border border-gray-300 p-3">PDFs, text, voice recordings, YouTube URLs</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 p-3 font-semibold">Generated Content</td>
                            <td className="border border-gray-300 p-3">Notes, flashcards, quizzes, study sets</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 p-3 font-semibold">Payment Information</td>
                            <td className="border border-gray-300 p-3">Billing details (processed by Stripe)</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 p-3 font-semibold">Communications</td>
                            <td className="border border-gray-300 p-3">Support inquiries, feedback</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h3 className="text-lg font-bold text-[#047857] mt-6 mb-3">2.2 Automatically Collected Information</h3>
            <p className="mb-2">We automatically collect certain information when you use the Service:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
                <li><strong>Usage Data:</strong> Pages viewed, features used, time spent</li>
                <li><strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
                <li><strong>Log Data:</strong> IP address, access times, error logs</li>
                <li><strong>Cookies:</strong> Authentication tokens, preferences (see Section 8)</li>
            </ul>

            <h3 className="text-lg font-bold text-[#047857] mt-6 mb-3">2.3 Third-Party Information</h3>
            <p className="mb-2">If you sign in with Google or other third-party services, we receive:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Profile information (name, email, profile picture)</li>
                <li>Authentication tokens</li>
            </ul>
        </div>

        <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#059669] mt-8 mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">We use collected information for the following purposes:</p>
            
            <h3 className="text-lg font-bold text-[#047857] mt-6 mb-2">3.1 Service Provision</h3>
            <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Process uploaded content to generate study materials</li>
                <li>Create and manage your account</li>
                <li>Store and organize your study sets</li>
                <li>Enable features like flashcards, quizzes, and podcasts</li>
            </ul>

            <h3 className="text-lg font-bold text-[#047857] mt-6 mb-2">3.2 Service Improvement</h3>
            <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Analyze usage patterns to improve features</li>
                <li>Train and improve AI models</li>
                <li>Identify and fix technical issues</li>
                <li>Develop new features</li>
            </ul>

            <h3 className="text-lg font-bold text-[#047857] mt-6 mb-2">3.3 Communication</h3>
            <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Send service-related notifications</li>
                <li>Respond to support inquiries</li>
                <li>Send promotional communications (with your consent)</li>
                <li>Notify you of important changes to the Service</li>
            </ul>

            <h3 className="text-lg font-bold text-[#047857] mt-6 mb-2">3.4 Security and Compliance</h3>
            <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Prevent fraud and abuse</li>
                <li>Enforce Terms of Service</li>
                <li>Comply with legal obligations</li>
                <li>Protect our rights and users' safety</li>
            </ul>
        </div>

        <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#059669] mt-8 mb-4">4. AI Processing and Content</h2>
            <h3 className="text-lg font-bold text-[#047857] mt-6 mb-2">4.1 AI Model Training</h3>
            <p className="mb-2">We use Google's Gemini AI to process your content. Your uploaded content may be used to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Generate study materials (notes, flashcards, quizzes)</li>
                <li>Improve our AI processing capabilities</li>
            </ul>
            <p className="mb-4 text-gray-700 bg-gray-50 p-4 border-l-4 border-emerald-500"><strong>Note:</strong> We anonymize content before using it for AI training. Personal information is removed.</p>

            <h3 className="text-lg font-bold text-[#047857] mt-6 mb-2">4.2 AI Content Disclaimer</h3>
            <p className="mb-2">AI-generated content may contain errors, biases, or inappropriate information. We:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Do not manually review all AI outputs</li>
                <li>Cannot guarantee accuracy or appropriateness</li>
                <li>Are not responsible for consequences of using AI-generated content</li>
            </ul>
        </div>

        <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#059669] mt-8 mb-4">5. Data Sharing and Disclosure</h2>
            <p className="mb-4 font-bold text-gray-900">We do not sell your personal information. We share information only in these circumstances:</p>

            <h3 className="text-lg font-bold text-[#047857] mt-6 mb-2">5.1 Service Providers</h3>
            <p className="mb-2">We share information with trusted third-party service providers who assist us in operating the Service. These providers are contractually bound to protect your information and use it only for the purposes we specify. We engage providers for the following categories of services:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>AI content generation and processing</li>
                <li>Authentication and secure database hosting</li>
                <li>Payment processing (billing information handled by our payment processor)</li>
                <li>Content retrieval and transcript services</li>
            </ul>
            <p className="mb-4">We do not share more information than necessary with any service provider.</p>

            <h3 className="text-lg font-bold text-[#047857] mt-6 mb-2">5.2 Legal Requirements</h3>
            <p className="mb-2">We may disclose information if required by law or to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Comply with legal processes (subpoenas, court orders)</li>
                <li>Enforce our Terms of Service</li>
                <li>Protect our rights, property, or safety</li>
                <li>Protect users' safety or rights</li>
            </ul>

            <h3 className="text-lg font-bold text-[#047857] mt-6 mb-2">5.3 Business Transfers</h3>
            <p className="mb-4">If free-ed is acquired or merged, your information may be transferred to the acquiring entity.</p>

            <h3 className="text-lg font-bold text-[#047857] mt-6 mb-2">5.4 Aggregated Data</h3>
            <p className="mb-4">We may share anonymized, aggregated data that cannot identify you personally for research or marketing purposes.</p>
        </div>

        <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#059669] mt-8 mb-4">6. Data Storage and Security</h2>
            <h3 className="text-lg font-bold text-[#047857] mt-6 mb-2">6.1 Data Location</h3>
            <p className="mb-2">Your data is stored on:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Firebase servers (Google Cloud Platform)</li>
                <li>Our hosting infrastructure</li>
                <li>Third-party service provider servers</li>
            </ul>
            <p className="mb-4">Data may be stored and processed in various countries, including the United States.</p>

            <h3 className="text-lg font-bold text-[#047857] mt-6 mb-2">6.2 Security Measures</h3>
            <p className="mb-2">We implement security measures including:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Encryption in transit (HTTPS/TLS)</li>
                <li>Encryption at rest for sensitive data</li>
                <li>Secure authentication (password hashing)</li>
                <li>Regular security audits</li>
                <li>Access controls and monitoring</li>
            </ul>

            <h3 className="text-lg font-bold text-[#047857] mt-6 mb-2">6.3 Data Retention</h3>
            <p className="mb-2">We retain your data:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>As long as your account is active</li>
                <li>As needed to provide the Service</li>
                <li>As required by law</li>
                <li>To resolve disputes or enforce agreements</li>
            </ul>
            <p className="mb-4">Deleted accounts: Data is permanently deleted within 90 days of account deletion, except where retention is legally required.</p>
        </div>

        <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#059669] mt-8 mb-4">7. Your Rights and Choices</h2>
            <h3 className="text-lg font-bold text-[#047857] mt-6 mb-2">7.1 Access and Correction</h3>
            <p className="mb-2">You can access and update your information through:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Account settings page</li>
                <li>Contacting support at <a href="mailto:hazelnote@free-ed.site" className="text-emerald-600 underline">hazelnote@free-ed.site</a></li>
            </ul>

            <h3 className="text-lg font-bold text-[#047857] mt-6 mb-2">7.2 Data Deletion</h3>
            <p className="mb-2">You can request deletion of:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Specific study sets</li>
                <li>Your entire account and all associated data</li>
            </ul>

            <h3 className="text-lg font-bold text-[#047857] mt-6 mb-2">7.3 Data Export</h3>
            <p className="mb-4">You can request an export of your data (study sets, notes, flashcards) in JSON or PDF format.</p>

            <h3 className="text-lg font-bold text-[#047857] mt-6 mb-2">7.4 Marketing Communications</h3>
            <p className="mb-2">You can opt out of promotional emails by:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Clicking "unsubscribe" in any email</li>
                <li>Adjusting preferences in account settings</li>
            </ul>
            <p className="mb-4 text-sm text-gray-500">Note: You cannot opt out of service-related communications (e.g., security alerts).</p>

            <h3 className="text-lg font-bold text-[#047857] mt-6 mb-2">7.5 Cookies</h3>
            <p className="mb-4">You can control cookies through browser settings. Note that disabling cookies may limit Service functionality.</p>
        </div>

        <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#059669] mt-8 mb-4">8. Cookies and Tracking Technologies</h2>
            <p className="mb-4">We use cookies and similar technologies for:</p>

            <h3 className="text-lg font-bold text-[#047857] mt-4 mb-2">8.1 Essential Cookies</h3>
            <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Authentication and session management</li>
                <li>Security features</li>
                <li>Load balancing</li>
            </ul>

            <h3 className="text-lg font-bold text-[#047857] mt-4 mb-2">8.2 Analytics Cookies</h3>
            <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Google Analytics: Usage statistics</li>
                <li>Firebase Analytics: Feature usage</li>
            </ul>

            <h3 className="text-lg font-bold text-[#047857] mt-4 mb-2">8.3 Preference Cookies</h3>
            <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Remember your settings (theme, language)</li>
                <li>Store feature preferences</li>
            </ul>
        </div>

        <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#059669] mt-8 mb-4">9. Children's Privacy</h2>
            <p className="mb-2">HazelNote is not intended for children under 13. We do not knowingly collect information from children under 13.</p>
            <p className="mb-2">Users aged 13-17 must have parental consent to use the Service.</p>
            <p className="mb-4">If we discover we have collected information from a child under 13, we will delete it immediately.</p>
        </div>

        <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#059669] mt-8 mb-4">10. International Users</h2>
            <p className="mb-2">If you are accessing the Service from outside Pakistan, your information may be transferred to, stored, and processed in Pakistan and other countries where our service providers operate. Appropriate safeguards are in place to protect your data in accordance with applicable law.</p>
            <p className="mb-4">By using the Service, you consent to such transfer of your information.</p>
        </div>

        <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#059669] mt-8 mb-4">11. California Privacy Rights (CCPA)</h2>
            <p className="mb-2">If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
                <li><strong>Right to Know:</strong> Request information about data we collect and use</li>
                <li><strong>Right to Delete:</strong> Request deletion of your personal information</li>
                <li><strong>Right to Opt-Out:</strong> Opt out of data sales (we do not sell data)</li>
                <li><strong>Non-Discrimination:</strong> We will not discriminate against you for exercising these rights</li>
            </ul>
            <p className="mb-4">To exercise these rights, contact us at <a href="mailto:hazelnote@free-ed.site" className="text-emerald-600 underline">hazelnote@free-ed.site</a>.</p>
        </div>

        <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#059669] mt-8 mb-4">12. Pakistani Data Protection</h2>
            <p className="mb-4">HazelNote operates in compliance with applicable Pakistani data protection laws including the Prevention of Electronic Crimes Act (PECA) 2016. If you are a Pakistan-based user, you have the right to access, correct, and request deletion of your personal data. Contact us at <a href="mailto:hazelnote@free-ed.site" className="text-emerald-600 underline">hazelnote@free-ed.site</a> to exercise these rights.</p>
        </div>

        <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#059669] mt-8 mb-4">12b. European Privacy Rights (GDPR)</h2>
            <p className="mb-2">If you are in the European Economic Area (EEA), you have rights under the General Data Protection Regulation (GDPR):</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
                <li><strong>Right to Access:</strong> Obtain a copy of your personal data</li>
                <li><strong>Right to Rectification:</strong> Correct inaccurate data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your data</li>
                <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
                <li><strong>Right to Data Portability:</strong> Receive your data in a structured format</li>
                <li><strong>Right to Object:</strong> Object to certain processing activities</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
            </ul>
            <p className="mb-4">To exercise these rights, contact us at <a href="mailto:hazelnote@free-ed.site" className="text-emerald-600 underline">hazelnote@free-ed.site</a>.</p>
        </div>

        <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#059669] mt-8 mb-4">13. Changes to This Privacy Policy</h2>
            <p className="mb-2">We may update this Privacy Policy from time to time. We will notify you of material changes by:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Posting the updated policy on our website</li>
                <li>Sending an email notification</li>
                <li>Displaying a prominent notice in the Service</li>
            </ul>
            <p className="mb-4">Continued use of the Service after changes constitutes acceptance of the updated policy.</p>
        </div>

        <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#059669] mt-8 mb-4">14. Contact Us</h2>
            <p className="mb-2">If you have questions about this Privacy Policy or our data practices, please contact us:</p>
            <p className="mb-4">
                <strong>Email:</strong> <a href="mailto:hazelnote@free-ed.site" className="text-emerald-600 underline">hazelnote@free-ed.site</a>
            </p>
        </div>
      </div>
    </div>
  );
}