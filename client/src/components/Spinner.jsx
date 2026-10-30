export default function Spinner({ size = 'md' }) {
  const dim = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-12 w-12' : 'h-8 w-8';
  return (
    <div className="flex justify-center items-center py-8">
      <div className={`${dim} animate-spin rounded-full border-4 border-gray-200 border-t-primary-600`} />
    </div>
  );
}
