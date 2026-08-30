'use client';

const Loading = () => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f6]">
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"
        aria-label="Loading"
      />
    </main>
  );
};

export default Loading;
