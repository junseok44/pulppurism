  interface TitleCardProps {
    title: string;
    description: string;
  }

  export default function TitleCard({ title, description }: TitleCardProps){
    return(
      <div className="text-center mb-16 space-y-4">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
        {title}
      </h1>
      <p className="text-gray-500 text-lg">
        {description}
      </p>
      </div>
    );
  }