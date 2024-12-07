// src/components/DataEntryForm.jsx
import { useState } from "react";
import { Input, Button, Select, SelectItem } from "@nextui-org/react";
import { Plus } from "lucide-react";

const validateField = (field, value) => {
  switch (field) {
    case "hex_code":
      const hexPattern = /^#?[0-9A-Fa-f]{6}$/;
      if (!hexPattern.test(value)) {
        return "Invalid hex color code. Format: #RRGGBB";
      }
      break;
    case "color_id":
      const colorId = parseInt(value);
      if (isNaN(colorId) || colorId < 0) {
        return "Color ID must be a positive number";
      }
      break;
    case "blueprint":
      if (value && !value.includes("Blueprint")) {
        return 'Blueprint must contain "Blueprint" keyword';
      }
      break;
    case "class_name":
      if (value && !value.includes("_C")) {
        return "Class name must end with _C";
      }
      break;
    default:
      if (!value.trim()) {
        return "This field is required";
      }
  }
  return null;
};

const DataEntryForm = ({ category, fields, onSubmit, types = [] }) => {
  const initialFormData = fields.reduce(
    (acc, field) => ({
      ...acc,
      [field]: "",
    }),
    { type_name: types[0] || "" }
  );

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate all fields
    const newErrors = {};
    fields.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const key = formData.name.replace(/ /g, "_");
    onSubmit(key, formData);
    setFormData(initialFormData);
    setErrors({});
  };

  const handleChange = (field) => (value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when field is modified
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {types.length > 0 && (
        <Select
          label="Type"
          value={formData.type_name}
          onChange={handleChange("type_name")}
        >
          {types.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </Select>
      )}

      {fields.map((field) => (
        <Input
          key={field}
          label={
            field.charAt(0).toUpperCase() + field.slice(1).replace("_", " ")
          }
          value={formData[field]}
          onChange={(e) => handleChange(field)(e.target.value)}
          errorMessage={errors[field]}
          isInvalid={!!errors[field]}
          required
        />
      ))}

      <Button
        color="primary"
        type="submit"
        startContent={<Plus className="w-4 h-4" />}
      >
        Add {category}
      </Button>
    </form>
  );
};

export default DataEntryForm;
