import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  type?: 'dashboard' | 'card' | 'list';
  count?: number;
}

export default function LoadingSkeleton({ type = 'dashboard', count = 1 }: LoadingSkeletonProps) {
  const skeletonAnimation = {
    initial: { opacity: 0.3 },
    animate: { opacity: [0.3, 0.7, 0.3] },
    transition: { duration: 1.5, repeat: Infinity }
  };

  if (type === 'dashboard') {
    return (
      <div className="ml-64 p-6 space-y-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <motion.div 
            className="h-8 w-64 bg-muted rounded mb-2"
            {...skeletonAnimation}
          />
          <motion.div 
            className="h-4 w-96 bg-muted rounded"
            {...skeletonAnimation}
          />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="bg-card rounded-lg border border-border p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <motion.div 
                  className="w-12 h-12 bg-muted rounded-lg"
                  {...skeletonAnimation}
                />
                <motion.div 
                  className="h-8 w-16 bg-muted rounded"
                  {...skeletonAnimation}
                />
              </div>
              <motion.div 
                className="h-5 w-24 bg-muted rounded mb-1"
                {...skeletonAnimation}
              />
              <motion.div 
                className="h-4 w-32 bg-muted rounded"
                {...skeletonAnimation}
              />
            </motion.div>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="bg-card rounded-lg border border-border p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <div className="flex items-start space-x-4">
                  <motion.div 
                    className="w-20 h-20 bg-muted rounded-lg"
                    {...skeletonAnimation}
                  />
                  <div className="flex-1">
                    <motion.div 
                      className="h-5 w-48 bg-muted rounded mb-2"
                      {...skeletonAnimation}
                    />
                    <motion.div 
                      className="h-4 w-full bg-muted rounded mb-2"
                      {...skeletonAnimation}
                    />
                    <motion.div 
                      className="h-4 w-3/4 bg-muted rounded mb-3"
                      {...skeletonAnimation}
                    />
                    <div className="flex space-x-6">
                      <motion.div 
                        className="h-4 w-12 bg-muted rounded"
                        {...skeletonAnimation}
                      />
                      <motion.div 
                        className="h-4 w-16 bg-muted rounded"
                        {...skeletonAnimation}
                      />
                      <motion.div 
                        className="h-4 w-14 bg-muted rounded"
                        {...skeletonAnimation}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <motion.div
                key={i}
                className="bg-card rounded-lg border border-border p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
              >
                <motion.div 
                  className="h-32 w-full bg-muted rounded-lg mb-4"
                  {...skeletonAnimation}
                />
                <motion.div 
                  className="h-5 w-32 bg-muted rounded mb-2"
                  {...skeletonAnimation}
                />
                <motion.div 
                  className="h-4 w-full bg-muted rounded mb-4"
                  {...skeletonAnimation}
                />
                <motion.div 
                  className="h-3 w-full bg-muted rounded mb-3"
                  {...skeletonAnimation}
                />
                <motion.div 
                  className="h-10 w-full bg-muted rounded"
                  {...skeletonAnimation}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="space-y-6">
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            className="bg-card rounded-lg border border-border p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex items-start space-x-4">
              <motion.div 
                className="w-20 h-20 bg-muted rounded-lg"
                {...skeletonAnimation}
              />
              <div className="flex-1">
                <motion.div 
                  className="h-5 w-48 bg-muted rounded mb-2"
                  {...skeletonAnimation}
                />
                <motion.div 
                  className="h-4 w-full bg-muted rounded mb-2"
                  {...skeletonAnimation}
                />
                <motion.div 
                  className="h-4 w-3/4 bg-muted rounded mb-3"
                  {...skeletonAnimation}
                />
                <div className="flex space-x-6">
                  <motion.div 
                    className="h-4 w-12 bg-muted rounded"
                    {...skeletonAnimation}
                  />
                  <motion.div 
                    className="h-4 w-16 bg-muted rounded"
                    {...skeletonAnimation}
                  />
                  <motion.div 
                    className="h-4 w-14 bg-muted rounded"
                    {...skeletonAnimation}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            className="flex items-center space-x-4 p-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <motion.div 
              className="w-10 h-10 bg-muted rounded-full"
              {...skeletonAnimation}
            />
            <div className="flex-1">
              <motion.div 
                className="h-4 w-3/4 bg-muted rounded mb-1"
                {...skeletonAnimation}
              />
              <motion.div 
                className="h-3 w-1/2 bg-muted rounded"
                {...skeletonAnimation}
              />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return null;
}
