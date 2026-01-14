"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, User, Star } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ContactData {
  id?: string;
  name: string;
  position: string;
  email: string;
  phone: string;
}

interface ContactFormProps {
  index: number;
  data: ContactData;
  canDelete: boolean;
  isPrimary: boolean;
  onChange: (data: ContactData) => void;
  onDelete: () => void;
}

export function ContactForm({
  index,
  data,
  canDelete,
  isPrimary,
  onChange,
  onDelete,
}: ContactFormProps) {
  const handleChange = (field: keyof ContactData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative rounded-lg border p-4 space-y-4",
        isPrimary ? "border-blue-200 bg-blue-50/50" : "border-slate-200 bg-slate-50/50"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              isPrimary ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-600"
            )}
          >
            <User className="h-4 w-4" />
          </div>
          <div>
            <span className="font-medium text-sm">
              Contacto {index + 1}
            </span>
            {isPrimary && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
                <Star className="h-3 w-3 fill-blue-600" />
                Principal
              </span>
            )}
          </div>
        </div>
        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Form fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`contact-name-${index}`} className="text-sm">
            Nombre <span className="text-red-500">*</span>
          </Label>
          <Input
            id={`contact-name-${index}`}
            placeholder="Nombre del contacto"
            value={data.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`contact-position-${index}`} className="text-sm">
            Cargo
          </Label>
          <Input
            id={`contact-position-${index}`}
            placeholder="Ej: Gerente de TI"
            value={data.position}
            onChange={(e) => handleChange("position", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`contact-email-${index}`} className="text-sm">
            Email
          </Label>
          <Input
            id={`contact-email-${index}`}
            type="email"
            placeholder="email@empresa.com"
            value={data.email}
            onChange={(e) => handleChange("email", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`contact-phone-${index}`} className="text-sm">
            Telefono
          </Label>
          <Input
            id={`contact-phone-${index}`}
            placeholder="+51 999 999 999"
            value={data.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
          />
        </div>
      </div>
    </motion.div>
  );
}

// Empty contact template
export const emptyContact: ContactData = {
  name: "",
  position: "",
  email: "",
  phone: "",
};
