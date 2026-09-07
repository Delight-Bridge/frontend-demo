type SectionHeadingProps = {
  title: string;
  description: string;
  href?: string;
  align?: "left" | "center";
  inverse?: boolean;
  titleClassName?: string;
};

export function SectionHeading({
  title,
  description,
  href,
  align = "center",
  inverse = false,
  titleClassName = "",
}: SectionHeadingProps) {
  const alignment = align === "left" ? "text-left" : "text-center";
  const titleColor = inverse ? "text-white" : "text-gray-900";
  const descriptionColor = inverse ? "text-gray-400" : "text-gray-500";

  return (
    <div className={alignment}>
      <h2 className={`mb-4 text-3xl font-bold md:text-4xl ${titleColor} ${titleClassName}`}>
        {href ? (
          <a
            href={href}
            className="rounded-sm transition-opacity hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-4"
          >
            {title}
          </a>
        ) : (
          title
        )}
      </h2>
      <p className={`font-light ${descriptionColor}`}>{description}</p>
    </div>
  );
}
