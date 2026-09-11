type SectionHeadingProps = {
  title: string;
  description: string;
  href?: string;
  align?: "left" | "center";
  inverse?: boolean;
  titleClassName?: string;
  as?: "h1" | "h2";
  eyebrow?: string;
};

export function SectionHeading({
  title,
  description,
  href,
  align = "center",
  inverse = false,
  titleClassName = "",
  as: Heading = "h2",
  eyebrow,
}: SectionHeadingProps) {
  const alignment = align === "left" ? "text-left" : "text-center";
  const titleColor = inverse ? "text-white" : "text-gray-900";
  const descriptionColor = inverse ? "text-gray-400" : "text-gray-600";

  return (
    <div className={alignment}>
      {eyebrow && <p className="mb-3 text-xs font-bold tracking-widest text-brand-800">{eyebrow}</p>}
      <div className="inline-flex max-w-full flex-col items-start">
        <Heading
          className={`mb-3 font-serif text-3xl font-bold leading-tight md:text-4xl ${titleColor} ${titleClassName}`}
        >
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
        </Heading>
        <span aria-hidden="true" className={`mb-3 block h-0.5 w-8 ${inverse ? "bg-brand-300" : "bg-brand-600"}`} />
      </div>
      <p className={`text-sm font-normal leading-6 ${descriptionColor}`}>{description}</p>
    </div>
  );
}
