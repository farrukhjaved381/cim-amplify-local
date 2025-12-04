'use client';

import { useRouter } from 'next/navigation';

export default function VerifyEmailFailurePage() {
  const router = useRouter();

  const handleResendClick = () => {
    router.push('/resend-verification'); // Assuming you'll create this page/route
  };

  return (
    <div style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '20px' }}>
      <img src="/illustration.png" alt="CIM Amplify Logo" style={{ maxWidth: '150px', margin: '20px auto' }} />
      <h1 style={{ color: '#e74c3c' }}>Email Verification Failed</h1>
      <p>Verification failed or token expired. Please request a new verification email.</p>
      <button
        onClick={handleResendClick}
        style={{
          backgroundColor: '#3aafa9',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginTop: '20px',
        }}
      >
        Resend Verification Email
      </button>
      <p style={{ marginTop: '50px', fontSize: '0.8em', color: '#6b7280' }}>
        © 2025 CIM Amplify. All rights reserved.
      </p>
    </div>
  );
}